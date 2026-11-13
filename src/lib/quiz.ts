import { db } from '../db/db';
import { TERMS, type Term } from '../glossary';
import type { QuizCard } from '../types';
import { shuffle } from './utils';

/** Intervalles de la révision espacée (système de Leitner à 5 boîtes). */
const INTERVALS_MS = [60_000, 10 * 60_000, 24 * 3600_000, 3 * 24 * 3600_000, 7 * 24 * 3600_000];

export function boxLabel(box: number): string {
  return ['À revoir', 'Fragile', 'En cours', 'Solide', 'Maîtrisé'][Math.max(0, Math.min(4, box - 1))] ?? '';
}

export async function pickNextTerm(excludeId?: string): Promise<{ term: Term; options: Term[] }> {
  const cards = new Map((await db.quiz.toArray()).map((c) => [c.termId, c]));
  const now = Date.now();
  const scored = TERMS.filter((t) => t.id !== excludeId).map((t) => {
    const c = cards.get(t.id);
    const box = c?.box ?? 1;
    const due = c?.due ?? 0;
    // Priorité : cartes dues, puis boîte basse, puis un peu de hasard.
    const priority = (due <= now ? 0 : 10) + box + Math.random() * 1.5;
    return { t, priority };
  });
  scored.sort((a, b) => a.priority - b.priority);
  const term = (scored[0]?.t ?? TERMS[0]) as Term;
  const sameCat = shuffle(TERMS.filter((t) => t.id !== term.id && t.category === term.category));
  const others = shuffle(TERMS.filter((t) => t.id !== term.id && t.category !== term.category));
  const distractors = [...sameCat.slice(0, 2), ...others].slice(0, 3);
  return { term, options: shuffle([term, ...distractors]) };
}

export async function recordAnswer(termId: string, correct: boolean): Promise<QuizCard> {
  const prev = await db.quiz.get(termId);
  const box = correct ? Math.min(5, (prev?.box ?? 1) + 1) : 1;
  const card: QuizCard = {
    termId,
    box,
    due: Date.now() + (INTERVALS_MS[box - 1] ?? INTERVALS_MS[0] ?? 60_000),
    seen: (prev?.seen ?? 0) + 1,
    correct: (prev?.correct ?? 0) + (correct ? 1 : 0)
  };
  await db.quiz.put(card);
  return card;
}
