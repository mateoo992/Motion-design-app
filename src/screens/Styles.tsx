import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { ConfirmButton, EmptyState, Field, Icon, Notice, PageHeader, TextField } from '../components/ui';
import { db } from '../db/db';
import { blankStyle, template1Blanc, TEMPLATE_1_ID } from '../lib/defaultStyle';
import { styleFromAI } from '../lib/styleParse';
import { useAI } from '../lib/useAI';
import { cx, extractJson, uid } from '../lib/utils';
import { STYLE_IMPORTER_SYSTEM } from '../prompts';
import { useProject } from '../store/project';
import { useUI } from '../store/ui';
import type { StyleTokens } from '../types';
import { ASPECTS } from '../types';

export function StylesScreen() {
  const styles = useLiveQuery(() => db.styles.orderBy('updatedAt').reverse().toArray(), [], undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const toast = useUI((s) => s.toast);
  const project = useProject((s) => s.project);
  const patchProject = useProject((s) => s.patch);

  useEffect(() => {
    if (styles && !selectedId && styles[0]) setSelectedId(styles[0].id);
  }, [styles, selectedId]);

  if (!styles) return null;
  const selected = styles.find((s) => s.id === selectedId);

  const createStyle = async () => {
    const s: StyleTokens = { ...blankStyle(), id: uid('st_') };
    await db.styles.put(s);
    setSelectedId(s.id);
  };
  const duplicate = async (s: StyleTokens) => {
    const now = Date.now();
    const copy: StyleTokens = { ...structuredClone(s), id: uid('st_'), name: `${s.name} (copie)`, builtin: false, createdAt: now, updatedAt: now };
    await db.styles.put(copy);
    setSelectedId(copy.id);
    toast('Style dupliqué', 'ok');
  };
  const remove = async (s: StyleTokens) => {
    await db.styles.delete(s.id);
    setSelectedId(null);
    toast('Style supprimé');
  };

  return (
    <div>
      <PageHeader
        title="Styles"
        subtitle="Ta bibliothèque de directions visuelles réutilisables : palette, typo, effets signature, rythme, easing et interdits."
        actions={
          <>
            <button type="button" className="btn-ghost btn-sm" onClick={() => setImporting((v) => !v)}>
              Importer depuis une description
            </button>
            <button type="button" className="btn-primary btn-sm" onClick={createStyle}>
              <Icon name="plus" className="h-4 w-4" /> Nouveau style
            </button>
          </>
        }
      />
      {importing && (
        <ImportPanel onImported={setSelectedId} onClose={() => setImporting(false)} />
      )}
      {styles.length === 0 ? (
        <EmptyState
          title="Aucun style"
          text="Crée ton premier style ou restaure le style préchargé."
          action={
            <button type="button" className="btn-primary" onClick={() => db.styles.put(template1Blanc())}>
              Restaurer « Template 1 blanc »
            </button>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" aria-label="Styles">
            {styles.map((s) => (
              <li key={s.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  aria-current={s.id === selectedId}
                  className={cx('card w-56 text-left transition-colors lg:w-full', s.id === selectedId && 'ring-2 ring-accent/50')}
                >
                  <StyleSwatch style={s} />
                  <p className="mt-2 truncate text-sm font-bold">{s.name}</p>
                  <p className="text-xs text-muted">
                    {s.builtin ? 'Préchargé' : 'Perso'} · {s.formats.join(' ')}
                  </p>
                </button>
              </li>
            ))}
          </ul>
          {selected && (
            <div className="card">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  disabled={project?.brief.styleId === selected.id}
                  onClick={async () => {
                    await patchProject((p) => ({ ...p, brief: { ...p.brief, styleId: selected.id } }));
                    toast(`« ${selected.name} » appliqué au projet`, 'ok');
                  }}
                >
                  {project?.brief.styleId === selected.id ? 'Style du projet actuel' : 'Utiliser pour le projet'}
                </button>
                <button type="button" className="btn-ghost btn-sm" onClick={() => duplicate(selected)}>
                  Dupliquer
                </button>
                {selected.builtin ? (
                  <ConfirmButton className="btn-ghost btn-sm" confirmLabel="Confirmer la restauration ?" onConfirm={() => db.styles.put(template1Blanc())}>
                    Restaurer l’original
                  </ConfirmButton>
                ) : (
                  <ConfirmButton onConfirm={() => remove(selected)}>Supprimer</ConfirmButton>
                )}
              </div>
              <StyleEditor key={`${selected.id}-${selected.updatedAt}`} style={selected} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StyleSwatch({ style }: { style: StyleTokens }) {
  const bg = style.palette[0]?.hex ?? '#ffffff';
  const ink = style.palette[1]?.hex ?? '#0d0d14';
  const grad = style.gradient ? `linear-gradient(${style.gradient.angle}deg, ${style.gradient.stops.join(', ')})` : style.palette[2]?.hex ?? ink;
  return (
    <div className="relative flex h-16 items-center justify-center overflow-hidden rounded-xl border border-line/10" style={{ background: bg }}>
      <div className="absolute -bottom-6 h-12 w-24 rounded-full opacity-60 blur-xl" style={{ background: grad }} />
      <span
        className="relative text-lg"
        style={{ color: ink, fontFamily: `${style.typography.family}, system-ui, sans-serif`, fontWeight: style.typography.weight, letterSpacing: style.typography.letterSpacing }}
      >
        Aa Motion
      </span>
    </div>
  );
}

const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

function StyleEditor({ style }: { style: StyleTokens }) {
  const [draft, setDraft] = useState<StyleTokens>(style);
  const [dirty, setDirty] = useState(false);
  const toast = useUI((s) => s.toast);
  const set = (patch: Partial<StyleTokens>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  };
  const save = async () => {
    await db.styles.put({ ...draft, updatedAt: Date.now() });
    setDirty(false);
    toast('Style enregistré', 'ok');
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <StyleSwatch style={draft} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Nom" value={draft.name} onChange={(v) => set({ name: v })} />
        <TextField label="Easing principal" value={draft.easing} onChange={(v) => set({ easing: v })} placeholder="expo out — cubic-bezier(0.16, 1, 0.3, 1)" />
      </div>
      <TextField label="Description" multiline value={draft.description} onChange={(v) => set({ description: v })} />

      <Field label="Palette">
        <ul className="space-y-2">
          {draft.palette.map((c, i) => (
            <li key={i} className="flex items-center gap-2">
              <input
                type="color"
                aria-label={`Couleur ${c.name}`}
                className="h-9 w-11 cursor-pointer rounded-lg border border-line/10 bg-transparent"
                value={c.hex}
                onChange={(e) => set({ palette: draft.palette.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)) })}
              />
              <input className="input w-28 font-mono text-xs" aria-label="Code hex" value={c.hex} onChange={(e) => set({ palette: draft.palette.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)) })} />
              <input className="input flex-1 text-xs" aria-label="Rôle de la couleur" value={c.name} onChange={(e) => set({ palette: draft.palette.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
              <button type="button" className="text-muted hover:text-danger" aria-label="Retirer la couleur" onClick={() => set({ palette: draft.palette.filter((_, j) => j !== i) })}>
                <Icon name="close" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn-ghost btn-sm mt-2" onClick={() => set({ palette: [...draft.palette, { name: 'Couleur', hex: '#3d7bff' }] })}>
          <Icon name="plus" className="h-3.5 w-3.5" /> Couleur
        </button>
      </Field>

      <Field label="Dégradé d’accent">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!draft.gradient} onChange={(e) => set({ gradient: e.target.checked ? { stops: ['#3d7bff', '#ff3d9a'], angle: 100 } : null })} />
            Activer
          </label>
          {draft.gradient && (
            <>
              <input
                className="input flex-1 font-mono text-xs"
                aria-label="Couleurs du dégradé (séparées par des virgules)"
                value={draft.gradient.stops.join(', ')}
                onChange={(e) => set({ gradient: { angle: draft.gradient?.angle ?? 100, stops: e.target.value.split(',').map((s) => s.trim()) } })}
              />
              <input
                type="number"
                className="input w-24 text-xs"
                aria-label="Angle en degrés"
                value={draft.gradient.angle}
                onChange={(e) => set({ gradient: { stops: draft.gradient?.stops ?? [], angle: parseFloat(e.target.value) || 0 } })}
              />
              <span className="text-xs text-muted">°</span>
            </>
          )}
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="Police" value={draft.typography.family} onChange={(v) => set({ typography: { ...draft.typography, family: v } })} />
        <TextField label="Graisse" type="number" value={String(draft.typography.weight)} onChange={(v) => set({ typography: { ...draft.typography, weight: parseInt(v, 10) || 400 } })} />
        <TextField label="Interlettrage" value={draft.typography.letterSpacing} onChange={(v) => set({ typography: { ...draft.typography, letterSpacing: v } })} />
      </div>
      <TextField label="Règles typographiques" multiline value={draft.typography.notes} onChange={(v) => set({ typography: { ...draft.typography, notes: v } })} />

      <LinesField label="Effets signature (un par ligne)" value={draft.signatureEffects} onChange={(v) => set({ signatureEffects: v })} />
      <LinesField label="Transitions (une par ligne)" value={draft.transitions} onChange={(v) => set({ transitions: v })} />

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="Durée totale (s)" type="number" value={String(draft.rhythm.totalDuration)} onChange={(v) => set({ rhythm: { ...draft.rhythm, totalDuration: parseFloat(v) || 0 } })} />
        <TextField label="Durée par scène" value={draft.rhythm.sceneDuration} onChange={(v) => set({ rhythm: { ...draft.rhythm, sceneDuration: v } })} />
        <TextField label="Intervalle entre mots (s)" type="number" value={String(draft.rhythm.wordInterval)} onChange={(v) => set({ rhythm: { ...draft.rhythm, wordInterval: parseFloat(v) || 0 } })} />
      </div>
      <TextField label="Notes de rythme" multiline value={draft.rhythm.notes} onChange={(v) => set({ rhythm: { ...draft.rhythm, notes: v } })} />

      <Field label="Formats">
        <div className="flex flex-wrap gap-1.5">
          {ASPECTS.map((a) => {
            const on = draft.formats.includes(a);
            return (
              <button key={a} type="button" aria-pressed={on} className={cx('chip', on && 'chip-active')} onClick={() => set({ formats: on ? draft.formats.filter((f) => f !== a) : [...draft.formats, a] })}>
                {a}
              </button>
            );
          })}
        </div>
      </Field>
      <LinesField label="Interdits (un par ligne)" value={draft.forbidden} onChange={(v) => set({ forbidden: v })} />

      <div className="sticky bottom-24 z-10 -mx-2 flex items-center gap-3 rounded-2xl bg-bg/85 p-2 backdrop-blur-md md:bottom-4">
        <button type="submit" className="btn-primary" disabled={!dirty}>
          Enregistrer
        </button>
        {dirty && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setDraft(style);
              setDirty(false);
            }}
          >
            Annuler
          </button>
        )}
        {draft.id === TEMPLATE_1_ID && <span className="text-xs text-muted">Style préchargé, modifiable.</span>}
      </div>
    </form>
  );
}

function LinesField({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState(value.join('\n'));
  return (
    <TextField
      label={label}
      multiline
      rows={Math.min(8, Math.max(3, value.length + 1))}
      value={text}
      onChange={(v) => {
        setText(v);
        onChange(lines(v));
      }}
    />
  );
}

function ImportPanel({ onImported, onClose }: { onImported: (id: string) => void; onClose: () => void }) {
  const [desc, setDesc] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [parseError, setParseError] = useState('');
  const { run, stop, streaming, error, ready } = useAI();
  const toast = useUI((s) => s.toast);

  const go = async () => {
    setParseError('');
    setQuestions([]);
    const res = await run({ messages: [{ role: 'user', content: desc }], system: STYLE_IMPORTER_SYSTEM, maxTokens: 2000, temperature: 0.2 });
    if (!res || res.aborted) return;
    try {
      const { style, questions: q } = styleFromAI(extractJson(res.text));
      await db.styles.put(style);
      setQuestions(q);
      toast('Style importé', 'ok');
      onImported(style.id);
      if (q.length === 0) onClose();
    } catch (e) {
      setParseError(`Impossible de lire la réponse de l’IA : ${e instanceof Error ? e.message : 'format invalide'}. Réessaie.`);
    }
  };

  return (
    <div className="card mb-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Importer un style depuis une description libre</p>
        <button type="button" className="btn-ghost btn-sm" onClick={onClose}>
          Fermer
        </button>
      </div>
      {!ready.ok && <Notice tone="warn">Cette fonction utilise l’IA : {ready.reason} Active Claude ou Ollama dans Réglages.</Notice>}
      <TextField
        label="Décris le style"
        multiline
        rows={4}
        value={desc}
        onChange={setDesc}
        placeholder="Ex. : fond noir profond, texte blanc cassé, un seul accent vert menthe, typo Inter très grasse et serrée, apparitions par masque, rythme rapide…"
      />
      <div className="flex gap-2">
        {streaming ? (
          <button type="button" className="btn-ghost" onClick={stop}>
            Annuler
          </button>
        ) : (
          <button type="button" className="btn-primary" disabled={!desc.trim() || !ready.ok} onClick={go}>
            Transformer en tokens
          </button>
        )}
        {streaming && <span className="self-center text-sm text-muted">Analyse en cours…</span>}
      </div>
      {error && <Notice tone="error">{error.message}</Notice>}
      {parseError && <Notice tone="error">{parseError}</Notice>}
      {questions.length > 0 && (
        <Notice tone="warn">
          <p className="font-semibold">Le style a été créé, mais l’IA n’a pas voulu inventer ces informations. Complète-les dans l’éditeur :</p>
          <ul className="mt-1 list-disc pl-5">
            {questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </Notice>
      )}
    </div>
  );
}
