import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import { DemoPlayer } from '../components/DemoPlayer';
import { EmptyState, Icon, PageHeader, Segmented } from '../components/ui';
import { db } from '../db/db';
import { CATEGORIES, TERMS, searchTerms, type CategoryId, type Term } from '../glossary';
import { boxLabel, pickNextTerm, recordAnswer } from '../lib/quiz';
import { cx } from '../lib/utils';
import { useUI } from '../store/ui';

export function LearnScreen() {
  const [mode, setMode] = useState<'glossary' | 'quiz'>('glossary');
  return (
    <div>
      <PageHeader
        title="Apprendre"
        subtitle={`${TERMS.length} termes de motion design, chacun avec une démo animée, ses paramètres réels et la formulation exacte pour un prompt.`}
        actions={
          <Segmented
            label="Mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'glossary', label: 'Glossaire' },
              { value: 'quiz', label: 'Quiz reconnaissance' }
            ]}
          />
        }
      />
      {mode === 'glossary' ? <Glossary /> : <Quiz />}
    </div>
  );
}

function Glossary() {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<CategoryId | 'all' | 'fav'>('all');
  const openTerm = useUI((s) => s.openTerm);
  const favorites = useLiveQuery(() => db.favorites.toArray(), [], []);
  const favIds = useMemo(() => new Set(favorites.map((f) => f.termId)), [favorites]);

  const list = useMemo(() => {
    let l = searchTerms(query);
    if (cat === 'fav') l = l.filter((t) => favIds.has(t.id));
    else if (cat !== 'all') l = l.filter((t) => t.category === cat);
    return l;
  }, [query, cat, favIds]);

  return (
    <div className="space-y-4">
      <div className="glass flex items-center gap-2 rounded-2xl px-3">
        <Icon name="search" className="h-4 w-4 text-muted" />
        <input
          className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted/70"
          placeholder="Rechercher un terme, un effet, un easing…"
          aria-label="Rechercher dans le glossaire"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Catégories">
        <CatChip active={cat === 'all'} onClick={() => setCat('all')} label={`Tous (${TERMS.length})`} />
        <CatChip active={cat === 'fav'} onClick={() => setCat('fav')} label={`★ Favoris (${favIds.size})`} />
        {CATEGORIES.map((c) => (
          <CatChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)} label={c.label} />
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState
          title={cat === 'fav' ? 'Aucun favori' : 'Aucun résultat'}
          text={cat === 'fav' ? 'Ouvre une fiche et appuie sur « Ajouter aux favoris » pour la retrouver ici.' : 'Essaie un autre mot : “blur”, “stagger”, “wipe”, “9:16”…'}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <li key={t.id}>
              <button type="button" onClick={() => openTerm(t.id)} className="card group h-full w-full text-left transition-transform hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                    {CATEGORIES.find((c) => c.id === t.category)?.label}
                  </span>
                  {favIds.has(t.id) && <Icon name="star" className="h-4 w-4 fill-current text-[#ff3d9a]" />}
                </div>
                <p className="mt-1 text-lg font-bold tracking-[-0.02em]">{t.name}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{t.definition}</p>
                <p className="mt-3 text-xs font-semibold text-fg/80 group-hover:underline">Voir la démo →</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CatChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick} className={cx('chip shrink-0', active && 'chip-active')}>
      {label}
    </button>
  );
}

function Quiz() {
  const [round, setRound] = useState<{ term: Term; options: Term[] } | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [score, setScore] = useState({ ok: 0, total: 0, streak: 0 });
  const [box, setBox] = useState<number | null>(null);
  const openTerm = useUI((s) => s.openTerm);
  const cards = useLiveQuery(() => db.quiz.toArray(), [], []);
  const mastered = cards.filter((c) => c.box >= 4).length;

  const next = async (exclude?: string) => {
    setAnswer(null);
    setBox(null);
    setRound(await pickNextTerm(exclude));
  };

  useEffect(() => {
    void next();
  }, []);

  const choose = async (id: string) => {
    if (!round || answer) return;
    const ok = id === round.term.id;
    setAnswer(id);
    setScore((s) => ({ ok: s.ok + (ok ? 1 : 0), total: s.total + 1, streak: ok ? s.streak + 1 : 0 }));
    const card = await recordAnswer(round.term.id, ok);
    setBox(card.box);
  };

  if (!round) return null;
  const correct = answer === round.term.id;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p>
          Score : <strong>{score.ok}</strong> / {score.total}
          {score.streak >= 2 && <span className="ml-2 gradient-text font-bold">série de {score.streak} !</span>}
        </p>
        <p className="text-muted">
          Maîtrisés : <strong className="text-fg">{mastered}</strong> / {TERMS.length}
        </p>
      </div>
      <div className="card space-y-4">
        <p className="text-sm font-semibold text-muted">Quel effet est démontré ?</p>
        <DemoPlayer key={round.term.id} term={round.term} loop bare />
        <div className="grid gap-2 sm:grid-cols-2">
          {round.options.map((o) => {
            const isRight = o.id === round.term.id;
            const picked = answer === o.id;
            return (
              <button
                key={o.id}
                type="button"
                disabled={!!answer}
                onClick={() => choose(o.id)}
                className={cx(
                  'rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors disabled:cursor-default',
                  !answer && 'border-line/10 bg-surface/70 hover:border-accent/50',
                  answer && isRight && 'border-ok/50 bg-ok/10',
                  answer && picked && !isRight && 'border-danger/50 bg-danger/10',
                  answer && !picked && !isRight && 'border-line/10 opacity-50'
                )}
              >
                {o.name}
              </button>
            );
          })}
        </div>
        {answer && (
          <div className="fade-in space-y-3" role="status">
            <p className={cx('font-semibold', correct ? 'text-ok' : 'text-danger')}>
              {correct ? 'Bien vu !' : `Raté : c’était « ${round.term.name} ».`}
              {box !== null && <span className="ml-2 text-xs font-normal text-muted">Niveau : {boxLabel(box)}</span>}
            </p>
            <p className="text-sm text-muted">{round.term.definition}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-primary" onClick={() => next(round.term.id)}>
                Suivant
              </button>
              <button type="button" className="btn-ghost" onClick={() => openTerm(round.term.id)}>
                Voir la fiche
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="text-center text-xs text-muted">
        Révision espacée : un terme raté revient vite, un terme réussi revient de plus en plus tard (1 min → 10 min → 1 j → 3 j → 7 j).
      </p>
    </div>
  );
}
