import type { ReactNode } from 'react';
import { useProject } from '../store/project';
import { providerReady } from '../providers';
import { useSettings } from '../store/settings';
import { useUI } from '../store/ui';
import type { TabId } from '../types';
import { cx } from '../lib/utils';
import { Icon, type IconName } from './ui';

const TABS: Array<{ id: TabId; label: string; icon: IconName }> = [
  { id: 'learn', label: 'Apprendre', icon: 'learn' },
  { id: 'atelier', label: 'Atelier', icon: 'atelier' },
  { id: 'styles', label: 'Styles', icon: 'styles' },
  { id: 'generate', label: 'Générer', icon: 'generate' },
  { id: 'projects', label: 'Projets', icon: 'projects' }
];

const ENGINE_LABEL = { claude: 'Claude', ollama: 'Ollama', offline: 'Hors ligne' } as const;

export function Layout({ children }: { children: ReactNode }) {
  const tab = useUI((s) => s.tab);
  const setTab = useUI((s) => s.setTab);
  const settings = useSettings((s) => s.settings);
  const provider = settings.provider;
  const engineOk = providerReady(settings).ok;
  const project = useProject((s) => s.project);

  return (
    <div className="min-h-screen md:flex">
      {/* Barre latérale desktop */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1 p-4 md:flex">
        <div className="glass flex h-full flex-col rounded-3xl p-3">
          <div className="mb-6 flex items-center gap-2 px-2 pt-2">
            <span className="h-7 w-7 rounded-full gradient-bg" aria-hidden />
            <span className="text-[15px] font-bold tracking-[-0.03em]">MotionPrompter</span>
          </div>
          <nav aria-label="Navigation principale" className="flex flex-col gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className={cx(
                  'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors',
                  tab === t.id ? 'bg-fg text-bg' : 'text-muted hover:bg-surface/70 hover:text-fg'
                )}
              >
                <Icon name={t.icon} />
                {t.label}
              </button>
            ))}
          </nav>
          <div className="mt-auto space-y-2 px-2 pb-1 text-xs text-muted">
            {project && (
              <p className="truncate" title={project.name}>
                Projet : <span className="font-semibold text-fg">{project.name}</span>
              </p>
            )}
            <button type="button" className="chip" onClick={() => setTab('projects')}>
              <span className={cx('mr-1.5 inline-block h-2 w-2 rounded-full', provider === 'offline' ? 'bg-muted' : engineOk ? 'bg-ok' : 'bg-amber-500')} />
              Moteur : {ENGINE_LABEL[provider]}
            </button>
          </div>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 sm:px-6 md:pb-10 md:pt-10">{children}</main>

      {/* Barre d'onglets mobile */}
      <nav aria-label="Navigation principale" className="glass pb-safe fixed inset-x-3 bottom-3 z-40 flex justify-between rounded-3xl px-2 pt-2 md:hidden">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
            className={cx(
              'flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[10.5px] font-semibold transition-colors',
              tab === t.id ? 'text-fg' : 'text-muted'
            )}
          >
            <span className={cx('rounded-full px-3 py-1', tab === t.id && 'bg-fg text-bg')}>
              <Icon name={t.icon} className="h-5 w-5" />
            </span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export function Toasts() {
  const toasts = useUI((s) => s.toasts);
  const dismiss = useUI((s) => s.dismiss);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismiss(t.id)}
          className={cx(
            'fade-in glass pointer-events-auto rounded-full px-4 py-2 text-sm font-semibold',
            t.tone === 'error' && 'text-danger',
            t.tone === 'ok' && 'text-ok'
          )}
        >
          {t.text}
        </button>
      ))}
    </div>
  );
}
