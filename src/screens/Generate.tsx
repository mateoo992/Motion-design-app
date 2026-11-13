import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { Icon, Notice, PageHeader, Segmented } from '../components/ui';
import { db } from '../db/db';
import { briefForAI, briefIssues, totalSeconds } from '../lib/brief';
import { analyzeCorrection, analyzePrompt } from '../lib/promptQuality';
import { useAI } from '../lib/useAI';
import { copyText, cx, downloadText, formatDate, slugify, uid } from '../lib/utils';
import {
  buildOfflineFix,
  buildTemplatePrompt,
  finalPromptSystem,
  finalPromptUserMessage,
  MISSING_MARKER,
  QUESTION_MARKER,
  RENDER_FIXER_SYSTEM,
  renderFixerUserMessage,
  rewriteSystem,
  rewriteUserMessage,
  styleForAI,
  type RewriteMode
} from '../prompts';
import { useProject } from '../store/project';
import { useUI } from '../store/ui';
import type { Aspect, PromptVersion } from '../types';
import { ASPECTS } from '../types';

type Busy = null | 'generate' | 'rewrite' | 'fix';

export function GenerateScreen() {
  const project = useProject((s) => s.project);
  const patch = useProject((s) => s.patch);
  const setTab = useUI((s) => s.setTab);
  const toast = useUI((s) => s.toast);
  const styles = useLiveQuery(() => db.styles.orderBy('name').toArray(), [], []);
  const { run, stop, streaming, error, setError, ready, settings } = useAI();
  const [stream, setStream] = useState('');
  const [busy, setBusy] = useState<Busy>(null);
  const [aiNotice, setAiNotice] = useState<{ tone: 'warn' | 'info'; text: string } | null>(null);
  const [feedback, setFeedback] = useState('');
  const [formatChoice, setFormatChoice] = useState<Aspect | null>(null);

  const brief = project?.brief;
  const style = styles.find((s) => s.id === brief?.styleId);
  const format: Aspect = formatChoice ?? (brief?.format || style?.formats[0] || '9:16');
  const issues = useMemo(() => (brief ? briefIssues(brief) : []), [brief]);
  const active = project?.versions.find((v) => v.id === project.activeVersionId) ?? project?.versions[project.versions.length - 1];
  const offline = settings.provider === 'offline';
  const useAIEngine = !offline && ready.ok;
  const display = streaming ? stream : active?.content ?? '';
  const isCorrection = !streaming && active?.kind === 'correction';
  const checks = useMemo(
    () => (brief && display ? (isCorrection || busy === 'fix' ? analyzeCorrection(display) : analyzePrompt(display, brief)) : []),
    [display, brief, isCorrection, busy]
  );

  if (!project || !brief) return null;

  const addVersion = async (content: string, label: string, source: PromptVersion['source'], fmt: Aspect | '' = format, kind: PromptVersion['kind'] = 'final') => {
    const v: PromptVersion = { id: uid('v_'), createdAt: Date.now(), label, format: fmt, content: content.trim(), source, kind };
    await patch((p) => ({ ...p, versions: [...p.versions, v], activeVersionId: v.id }));
  };

  const streamTo = async (system: string, user: string, maxTokens = settings.maxOutputTokens) => {
    setStream('');
    const res = await run({ messages: [{ role: 'user', content: user }], system, maxTokens, temperature: 0.4, onToken: setStream });
    setStream('');
    return res;
  };

  const generate = async (mode: 'ai' | 'template') => {
    setAiNotice(null);
    setError(null);
    if (issues.length) return;
    if (mode === 'template') {
      await addVersion(buildTemplatePrompt(brief, style, { format }), `Gabarit ${format}`, 'gabarit');
      toast('Prompt généré par gabarit', 'ok');
      return;
    }
    setBusy('generate');
    const res = await streamTo(
      finalPromptSystem(),
      finalPromptUserMessage({ briefText: briefForAI(brief, style?.name), styleText: styleForAI(style), format, totalSeconds: totalSeconds(brief) })
    );
    setBusy(null);
    if (!res) return;
    const text = res.text.trim();
    if (text.startsWith(MISSING_MARKER) || text.includes(`\n${MISSING_MARKER}`)) {
      setAiNotice({ tone: 'warn', text: text.slice(text.indexOf(MISSING_MARKER) + MISSING_MARKER.length).trim() });
      return;
    }
    if (!text) return;
    await addVersion(text, `${res.aborted ? 'Interrompu' : 'IA'} ${format}`, 'ia');
    if (res.truncated) setAiNotice({ tone: 'warn', text: 'Le prompt a été coupé par la limite de longueur. Augmente « Longueur maximale de réponse » dans Réglages puis régénère.' });
  };

  const rewrite = async (mode: RewriteMode) => {
    if (!active) return;
    setAiNotice(null);
    const fmt: Aspect = typeof mode === 'object' ? mode.format : (active.format || format);
    const label = mode === 'precise' ? 'Plus précis' : mode === 'shorter' ? 'Raccourci' : `Version ${fmt}`;
    if (!useAIEngine) {
      // Hors ligne : on reconstruit à partir du gabarit (le brief fait foi).
      if (issues.length) return;
      const content = buildTemplatePrompt(brief, style, { format: fmt, precise: mode === 'precise', compact: mode === 'shorter' });
      await addVersion(content, `${label} (gabarit)`, 'gabarit', fmt);
      return;
    }
    setBusy('rewrite');
    const res = await streamTo(rewriteSystem(), rewriteUserMessage(active.content, mode));
    setBusy(null);
    if (res?.text.trim()) await addVersion(res.text, `${label}${res.aborted ? ' (interrompu)' : ''}`, 'ia', fmt);
  };

  const fix = async () => {
    const fb = feedback.trim();
    if (!fb || !active) return;
    setAiNotice(null);
    if (!useAIEngine) {
      const r = buildOfflineFix(fb);
      if (!r.ok) {
        setAiNotice({ tone: 'info', text: r.text });
        return;
      }
      await addVersion(r.text, 'Correction (règles)', 'gabarit', active.format, 'correction');
      setFeedback('');
      return;
    }
    setBusy('fix');
    const base = active.kind === 'correction' ? [...project.versions].reverse().find((v) => v.kind !== 'correction') ?? active : active;
    const res = await streamTo(RENDER_FIXER_SYSTEM, renderFixerUserMessage(base.content, fb), 4000);
    setBusy(null);
    if (!res) return;
    const text = res.text.trim();
    if (text.startsWith(QUESTION_MARKER)) {
      setAiNotice({ tone: 'info', text: text.slice(QUESTION_MARKER.length).trim() });
      return;
    }
    if (text) {
      await addVersion(text, 'Correction', 'ia', active.format, 'correction');
      setFeedback('');
    }
  };

  const editActive = (content: string) =>
    patch((p) => ({ ...p, versions: p.versions.map((v) => (v.id === active?.id ? { ...v, content } : v)) }));

  const exportMd = () => {
    if (!active) return;
    const header = `<!-- MotionPrompter · ${project.name} · ${active.label} · ${new Date(active.createdAt).toLocaleString('fr-FR')} -->\n\n`;
    downloadText(`${slugify(project.name)}-${slugify(active.label)}.md`, header + active.content, 'text/markdown');
  };

  const okCount = checks.filter((c) => c.ok).length;

  return (
    <div>
      <PageHeader title="Générer" subtitle="Le brief et le style deviennent un prompt final structuré en 7 sections, prêt à coller dans Claude." />

      <div className="card mb-5 grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="gen-style">
              Style
            </label>
            <select
              id="gen-style"
              className="input"
              value={brief.styleId ?? ''}
              onChange={(e) => patch((p) => ({ ...p, brief: { ...p.brief, styleId: e.target.value || null } }))}
            >
              <option value="">— Aucun —</option>
              {styles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="label">Format</span>
            <Segmented label="Format" value={format} onChange={setFormatChoice} options={ASPECTS.map((a) => ({ value: a, label: a }))} />
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {useAIEngine && (
            <button type="button" className="btn-primary" disabled={issues.length > 0 || streaming} onClick={() => generate('ai')}>
              <Icon name="generate" className="h-4 w-4" /> Générer avec l’IA
            </button>
          )}
          <button type="button" className={useAIEngine ? 'btn-ghost' : 'btn-primary'} disabled={issues.length > 0 || streaming} onClick={() => generate('template')}>
            Générer par gabarit
          </button>
        </div>
      </div>

      {issues.length > 0 && (
        <div className="mb-5">
          <Notice tone="warn">
            <p className="font-semibold">Le brief est incomplet : je ne vais pas inventer ce qui manque.</p>
            <ul className="mt-1 list-disc pl-5">
              {issues.slice(0, 8).map((i, k) => (
                <li key={k}>{i.label}</li>
              ))}
              {issues.length > 8 && <li>… et {issues.length - 8} autre(s)</li>}
            </ul>
            <button type="button" className="btn-primary btn-sm mt-3" onClick={() => setTab('atelier')}>
              Compléter dans l’Atelier →
            </button>
          </Notice>
        </div>
      )}
      {!offline && !ready.ok && (
        <div className="mb-5">
          <Notice tone="warn">
            {ready.reason} En attendant, le générateur par gabarit fonctionne sans IA.{' '}
            <button type="button" className="font-semibold underline" onClick={() => setTab('projects')}>
              Réglages
            </button>
          </Notice>
        </div>
      )}
      {error && (
        <div className="mb-5">
          <Notice tone="error">{error.message}</Notice>
        </div>
      )}
      {aiNotice && (
        <div className="mb-5">
          <Notice tone={aiNotice.tone}>
            {aiNotice.tone === 'warn' && <p className="mb-1 font-semibold">Informations manquantes signalées par l’IA :</p>}
            <p className="whitespace-pre-wrap">{aiNotice.text}</p>
            {aiNotice.tone === 'warn' && (
              <button type="button" className="btn-primary btn-sm mt-3" onClick={() => setTab('atelier')}>
                Compléter dans l’Atelier →
              </button>
            )}
          </Notice>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="card space-y-3" aria-label="Prompt final">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-ghost btn-sm"
              disabled={!active || streaming}
              onClick={async () => toast((await copyText(active?.content ?? '')) ? 'Prompt copié' : 'Copie impossible', 'ok')}
            >
              <Icon name="copy" className="h-4 w-4" /> Copier
            </button>
            <button type="button" className="btn-ghost btn-sm" disabled={!active || streaming} onClick={exportMd}>
              Export .md
            </button>
            <button type="button" className="btn-ghost btn-sm" disabled={!active || streaming || isCorrection} onClick={() => rewrite('precise')}>
              Rendre plus précis
            </button>
            <button type="button" className="btn-ghost btn-sm" disabled={!active || streaming || isCorrection} onClick={() => rewrite('shorter')}>
              Raccourcir
            </button>
            {streaming && (
              <button type="button" className="btn-danger btn-sm" onClick={stop}>
                <Icon name="stop" className="h-3.5 w-3.5" /> Arrêter
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-muted">Version :</span>
            {ASPECTS.map((a) => (
              <button key={a} type="button" className="chip" disabled={!active || streaming || isCorrection} onClick={() => rewrite({ format: a })}>
                {a}
              </button>
            ))}
          </div>
          {display ? (
            <textarea
              aria-label="Prompt final (modifiable)"
              className="input min-h-[55vh] font-mono text-[12.5px] leading-relaxed"
              value={display}
              readOnly={streaming}
              onChange={(e) => editActive(e.target.value)}
            />
          ) : (
            <div className="flex min-h-[30vh] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line/15 p-6 text-center text-sm text-muted">
              {busy ? 'Génération en cours…' : 'Aucun prompt pour ce projet. Complète le brief puis clique sur « Générer ».'}
            </div>
          )}
          {isCorrection && <p className="text-xs text-muted">Prompt de correction : colle-le dans la même conversation Claude que la vidéo à corriger.</p>}
          {streaming && <p className="text-xs text-muted">{busy === 'fix' ? 'Rédaction du prompt de correction…' : 'Écriture en cours…'}</p>}

          <div className="border-t border-line/10 pt-4">
            <h2 className="text-sm font-bold">Retour de rendu</h2>
            <p className="mb-2 text-xs text-muted">Décris ce qui ne va pas dans la vidéo obtenue ; je produis un prompt de correction ciblé à coller dans la même conversation avec Claude.</p>
            <textarea
              aria-label="Ton retour sur la vidéo obtenue"
              className="input"
              rows={3}
              value={feedback}
              placeholder="Ex. : trop lent au début, le texte flou dure trop longtemps, deux mots se superposent à 4 s…"
              onChange={(e) => setFeedback(e.target.value)}
            />
            <button type="button" className="btn-primary btn-sm mt-2" disabled={!feedback.trim() || !active || streaming} onClick={fix}>
              Produire le prompt de correction
            </button>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold">Qualité du prompt</h2>
              {checks.length > 0 && (
                <span className={cx('text-xs font-bold', okCount === checks.length ? 'text-ok' : 'text-muted')}>
                  {okCount}/{checks.length}
                </span>
              )}
            </div>
            {checks.length === 0 ? (
              <p className="text-xs text-muted">La checklist s’affiche dès qu’un prompt existe.</p>
            ) : (
              <ul className="space-y-2">
                {checks.map((c) => (
                  <li key={c.id} className="flex gap-2 text-xs">
                    <span className={cx('mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold', c.ok ? 'bg-ok/15 text-ok' : 'bg-danger/15 text-danger')} aria-hidden>
                      {c.ok ? '✓' : '!'}
                    </span>
                    <span>
                      <span className="font-semibold">{c.label}</span>
                      {c.detail && <span className="block text-muted">{c.detail}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card">
            <h2 className="mb-3 text-sm font-bold">Versions ({project.versions.length})</h2>
            {project.versions.length === 0 ? (
              <p className="text-xs text-muted">Chaque génération, réécriture ou correction crée une version.</p>
            ) : (
              <ul className="space-y-1.5">
                {[...project.versions].reverse().map((v) => (
                  <li key={v.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => patch((p) => ({ ...p, activeVersionId: v.id }))}
                      className={cx('flex-1 rounded-xl px-3 py-2 text-left text-xs', v.id === active?.id ? 'bg-fg text-bg' : 'hover:bg-surface/70')}
                      aria-current={v.id === active?.id}
                    >
                      <span className="block font-semibold">{v.label}</span>
                      <span className={cx('block', v.id === active?.id ? 'opacity-70' : 'text-muted')}>
                        {formatDate(v.createdAt)} · {v.source}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Supprimer la version ${v.label}`}
                      className="p-1 text-muted hover:text-danger"
                      onClick={() =>
                        patch((p) => {
                          const versions = p.versions.filter((x) => x.id !== v.id);
                          return { ...p, versions, activeVersionId: p.activeVersionId === v.id ? versions[versions.length - 1]?.id ?? null : p.activeVersionId };
                        })
                      }
                    >
                      <Icon name="close" className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
