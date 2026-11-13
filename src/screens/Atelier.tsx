import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BriefPanel } from '../components/BriefPanel';
import { RichText } from '../components/RichText';
import { Icon, Notice, PageHeader, Segmented } from '../components/ui';
import { db } from '../db/db';
import { applyBriefPatch, briefForAI, splitBriefBlock } from '../lib/brief';
import { useAI } from '../lib/useAI';
import { cx, uid } from '../lib/utils';
import { artDirectorSystem, BRIEF_QUESTIONS, QUICK_ACTIONS, styleForAI } from '../prompts';
import { useProject } from '../store/project';
import { useUI } from '../store/ui';
import type { Brief, ChatMessage, Project, StoredMessage } from '../types';
import { ASPECTS } from '../types';

const msg = (role: StoredMessage['role'], content: string): StoredMessage => ({ id: uid('m_'), role, content, createdAt: Date.now() });

function firstMissingQuestion(brief: Brief): number {
  return BRIEF_QUESTIONS.findIndex((q) => {
    if (q.key === 'platform') return !brief.platform.trim() || !brief.format;
    const v = brief[q.key as keyof Brief];
    return typeof v === 'string' && !v.trim();
  });
}

function greeting(brief: Brief): string {
  const idx = firstMissingQuestion(brief);
  const q = idx === -1 ? 'Ton brief de base est rempli. Raconte-moi ton idée de vidéo et je te propose 3 directions.' : BRIEF_QUESTIONS[idx]?.question;
  return `Salut Matéo ! Je suis ton directeur artistique. On construit ton brief ensemble, une question à la fois, puis je te challenge et je te propose 3 directions créatives.\n\n**${q}**`;
}

/** Convertit l'historique pour l'API (qui exige un premier message utilisateur). */
function toApiMessages(messages: StoredMessage[]): ChatMessage[] {
  const out: ChatMessage[] = messages.map(({ role, content }) => ({ role, content }));
  if (out[0]?.role === 'assistant') out.unshift({ role: 'user', content: 'Bonjour, je veux préparer une vidéo promo.' });
  // Fusionne les messages consécutifs du même rôle (exigence de l'API).
  return out.reduce<ChatMessage[]>((acc, m) => {
    const last = acc[acc.length - 1];
    if (last && last.role === m.role) last.content += `\n\n${m.content}`;
    else acc.push({ ...m });
    return acc;
  }, []);
}

/** Atelier hors ligne : questions scriptées qui remplissent le brief sans IA. */
function offlineAnswer(p: Project, answer: string): { brief: Brief; reply: string; step: number } {
  const brief = { ...p.brief };
  const idx = firstMissingQuestion(brief);
  const q = idx === -1 ? undefined : BRIEF_QUESTIONS[idx];
  if (q) {
    const key = q.key as keyof Brief;
    if (key === 'platform') {
      const fmt = ASPECTS.find((a) => answer.replace(/\s/g, '').includes(a));
      brief.platform = answer.trim();
      if (fmt) brief.format = fmt;
      else if (/tiktok|reel|story|short/i.test(answer)) brief.format = '9:16';
      else if (/linkedin|feed|fil/i.test(answer)) brief.format = '4:5';
      else if (/youtube|site|web/i.test(answer)) brief.format = '16:9';
      else brief.format = '1:1';
    } else if (key === 'duration') {
      const n = parseFloat(answer.replace(',', '.'));
      brief.duration = Number.isFinite(n) ? String(n) : answer.trim();
    } else {
      (brief as unknown as Record<string, unknown>)[key] = answer.trim();
    }
  }
  const nextIdx = firstMissingQuestion(brief);
  const reply =
    nextIdx === -1
      ? 'Merci, la base du brief est complète ✅\n\nEn mode hors ligne, je ne peux pas proposer de directions créatives. Ajoute maintenant tes **scènes** dans le panneau Brief (début/fin en secondes, texte exact, effet du glossaire, transition), puis va dans **Générer** pour obtenir le prompt par gabarit.'
      : `Noté. **${BRIEF_QUESTIONS[nextIdx]?.question}**`;
  return { brief, reply, step: nextIdx === -1 ? BRIEF_QUESTIONS.length : nextIdx };
}

export function AtelierScreen() {
  const project = useProject((s) => s.project);
  const patch = useProject((s) => s.patch);
  const create = useProject((s) => s.create);
  const toast = useUI((s) => s.toast);
  const setTab = useUI((s) => s.setTab);
  const { run, stop, streaming, error, setError, ready, settings } = useAI();
  const [input, setInput] = useState('');
  const [stream, setStream] = useState('');
  const [view, setView] = useState<'chat' | 'brief'>('chat');
  const endRef = useRef<HTMLDivElement>(null);
  const offline = settings.provider === 'offline';

  // Message d'accueil du directeur artistique (local, sans appel IA).
  useEffect(() => {
    if (project && project.messages.length === 0) {
      void patch((p) => (p.messages.length ? p : { ...p, messages: [msg('assistant', greeting(p.brief))] }));
    }
  }, [project, patch]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [project?.messages.length, stream]);

  if (!project) return null;

  const askAI = async (history: StoredMessage[]) => {
    const style = project.brief.styleId ? await db.styles.get(project.brief.styleId) : undefined;
    const current = useProject.getState().project ?? project;
    const system = artDirectorSystem({ briefText: briefForAI(current.brief, style?.name), styleText: styleForAI(style) });
    setStream('');
    const res = await run({
      messages: toApiMessages(history),
      system,
      maxTokens: 2500,
      temperature: 0.8,
      onToken: (full) => setStream(full)
    });
    setStream('');
    if (!res) return;
    const { visible, patch: briefPatch } = splitBriefBlock(res.text);
    let content = visible.trim();
    if (res.aborted) content = content ? `${content}\n\n_(réponse interrompue)_` : '';
    if (res.truncated) content += '\n\n_(réponse coupée : limite de longueur atteinte, demande « continue » si besoin)_';
    if (res.trimmed) toast('Conversation longue : les plus anciens messages ont été retirés du contexte.', 'info');
    await patch((p) => ({
      ...p,
      brief: briefPatch ? applyBriefPatch(p.brief, briefPatch, p.lockedFields) : p.brief,
      messages: content ? [...p.messages, msg('assistant', content)] : p.messages
    }));
  };

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || streaming) return;
    setInput('');
    if (offline) {
      const userMsg = msg('user', t);
      await patch((p) => {
        const r = offlineAnswer(p, t);
        return { ...p, brief: applyBriefPatch(p.brief, r.brief, p.lockedFields), offlineStep: r.step, messages: [...p.messages, userMsg, msg('assistant', r.reply)] };
      });
      return;
    }
    const userMsg = msg('user', t);
    const history = [...project.messages, userMsg];
    await patch((p) => ({ ...p, messages: [...p.messages, userMsg] }));
    await askAI(history);
  };

  const retry = async () => {
    setError(null);
    const cur = useProject.getState().project;
    if (cur) await askAI(cur.messages);
  };

  const resetConversation = async () => {
    stop();
    await patch((p) => ({ ...p, messages: [msg('assistant', greeting(p.brief))], offlineStep: 0 }));
  };

  const visibleStream = splitBriefBlock(stream).visible;
  const lastIsUser = project.messages[project.messages.length - 1]?.role === 'user';

  return (
    <div>
      <PageHeader
        title="Atelier"
        subtitle="Ton directeur artistique IA transforme ton idée en brief solide. Les termes techniques sont cliquables."
        actions={
          <>
            <button type="button" className="btn-ghost btn-sm" onClick={resetConversation}>
              Recommencer la discussion
            </button>
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={async () => {
                await create();
                toast('Nouveau projet créé', 'ok');
              }}
            >
              <Icon name="plus" className="h-4 w-4" /> Nouveau projet
            </button>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          aria-label="Nom du projet"
          className="input max-w-xs font-semibold"
          value={project.name}
          onChange={(e) => patch((p) => ({ ...p, name: e.target.value }))}
        />
        <div className="lg:hidden">
          <Segmented
            label="Vue"
            value={view}
            onChange={setView}
            options={[
              { value: 'chat', label: 'Conversation' },
              { value: 'brief', label: 'Brief' }
            ]}
          />
        </div>
      </div>

      {offline && (
        <div className="mb-4">
          <Notice tone="info">
            Mode hors ligne : je pose les questions du brief sans IA. Pour le challenge et les 3 directions créatives, active Claude ou Ollama dans{' '}
            <button type="button" className="font-semibold underline" onClick={() => setTab('projects')}>
              Réglages
            </button>
            .
          </Notice>
        </div>
      )}
      {!offline && !ready.ok && (
        <div className="mb-4">
          <Notice tone="warn">
            {ready.reason}{' '}
            <button type="button" className="font-semibold underline" onClick={() => setTab('projects')}>
              Ouvrir les réglages
            </button>
          </Notice>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className={cx('flex min-h-[60vh] flex-col', view === 'brief' && 'hidden lg:flex')} aria-label="Conversation">
          <div className="flex-1 space-y-3" aria-live="polite">
            {project.messages.map((m) => (
              <Bubble key={m.id} role={m.role} text={m.content} />
            ))}
            {streaming && (
              <Bubble role="assistant" text={visibleStream} pending>
                <button type="button" className="btn-ghost btn-sm mt-2" onClick={stop}>
                  <Icon name="stop" className="h-3.5 w-3.5" /> Arrêter
                </button>
              </Bubble>
            )}
            {error && (
              <Notice tone="error">
                <p>{error.message}</p>
                <div className="mt-2 flex gap-2">
                  {lastIsUser && error.code !== 'missing_key' && error.code !== 'missing_model' && (
                    <button type="button" className="btn-ghost btn-sm" onClick={retry}>
                      Réessayer
                    </button>
                  )}
                  {(error.code === 'missing_key' || error.code === 'auth' || error.code === 'missing_model' || error.code === 'network') && (
                    <button type="button" className="btn-ghost btn-sm" onClick={() => setTab('projects')}>
                      Réglages
                    </button>
                  )}
                </div>
              </Notice>
            )}
            <div ref={endRef} />
          </div>

          <div className="sticky bottom-24 z-10 -mx-2 mt-4 space-y-2 rounded-3xl bg-bg/85 p-2 backdrop-blur-md md:bottom-4">
            {!offline && (
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {QUICK_ACTIONS.map((a) => (
                  <button key={a.id} type="button" className="chip shrink-0" disabled={streaming || !ready.ok} onClick={() => send(a.message)}>
                    {a.label}
                  </button>
                ))}
              </div>
            )}
            <form
              className="glass flex items-end gap-2 rounded-3xl p-2"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <textarea
                aria-label="Ton message"
                rows={1}
                className="max-h-40 min-h-[2.5rem] flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted/70"
                placeholder={offline ? 'Réponds à la question…' : 'Décris ton idée, réponds à la question…'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
              />
              {streaming ? (
                <button type="button" className="btn-ghost" onClick={stop} aria-label="Arrêter la génération">
                  <Icon name="stop" className="h-4 w-4" />
                </button>
              ) : (
                <button type="submit" className="btn-primary" disabled={!input.trim() || (!offline && !ready.ok)} aria-label="Envoyer">
                  <Icon name="send" className="h-4 w-4" />
                </button>
              )}
            </form>
          </div>
        </section>

        <aside className={cx('card h-fit lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto', view === 'chat' && 'hidden lg:block')} aria-label="Brief">
          <BriefPanel />
          <button type="button" className="btn-primary mt-5 w-full" onClick={() => setTab('generate')}>
            Générer le prompt →
          </button>
        </aside>
      </div>
    </div>
  );
}

function Bubble({ role, text, pending, children }: { role: 'user' | 'assistant'; text: string; pending?: boolean; children?: ReactNode }) {
  const isUser = role === 'user';
  return (
    <div className={cx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cx(
          'max-w-[92%] rounded-3xl px-4 py-3 sm:max-w-[80%]',
          isUser ? 'rounded-br-lg bg-fg text-bg' : 'glass rounded-bl-lg'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed">{text}</p>
        ) : text ? (
          <RichText text={text} />
        ) : (
          <p className="text-sm text-muted">Réflexion…</p>
        )}
        {pending && text && <span className="blink ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 rounded-sm bg-fg/60" aria-hidden />}
        {children}
      </div>
    </div>
  );
}
