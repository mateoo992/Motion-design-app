import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { CATEGORIES, type Term } from '../glossary';
import { copyText, cx } from '../lib/utils';
import { useUI } from '../store/ui';
import { DemoPlayer } from './DemoPlayer';
import { Icon } from './ui';

export function useIsFavorite(termId: string): boolean {
  return useLiveQuery(() => db.favorites.get(termId).then(Boolean), [termId], false) ?? false;
}

export async function toggleFavorite(termId: string, current: boolean) {
  if (current) await db.favorites.delete(termId);
  else await db.favorites.put({ termId, createdAt: Date.now() });
}

export function TermDetail({ term }: { term: Term }) {
  const fav = useIsFavorite(term.id);
  const toast = useUI((s) => s.toast);
  const cat = CATEGORIES.find((c) => c.id === term.category)?.label ?? '';
  return (
    <article className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{cat}</p>
          <h2 className="mt-1 text-2xl font-bold tracking-[-0.03em]">{term.name}</h2>
        </div>
        <button
          type="button"
          className={cx('btn-ghost btn-sm', fav && 'text-[#ff3d9a]')}
          aria-pressed={fav}
          onClick={() => toggleFavorite(term.id, fav)}
        >
          <Icon name="star" className={cx('h-4 w-4', fav && 'fill-current')} />
          {fav ? 'Favori' : 'Ajouter aux favoris'}
        </button>
      </header>
      <p className="text-[0.95rem] leading-relaxed">{term.definition}</p>
      <DemoPlayer term={term} />
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line/10 bg-surface/60 p-3">
          <h3 className="label">Quand l’utiliser</h3>
          <p className="text-sm leading-relaxed">{term.whenToUse}</p>
        </div>
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-3">
          <h3 className="label">Erreur de débutant</h3>
          <p className="text-sm leading-relaxed">{term.mistake}</p>
        </div>
      </section>
      <section className="rounded-xl border border-accent/25 bg-accent/5 p-3">
        <h3 className="label">Dans un prompt pour Claude, écris</h3>
        <div className="flex items-start justify-between gap-3">
          <code className="font-mono text-sm leading-relaxed">{term.promptWord}</code>
          <button
            type="button"
            className="btn-ghost btn-sm shrink-0"
            onClick={async () => toast((await copyText(term.promptWord)) ? 'Formulation copiée' : 'Copie impossible', 'ok')}
          >
            <Icon name="copy" className="h-4 w-4" /> Copier
          </button>
        </div>
      </section>
    </article>
  );
}
