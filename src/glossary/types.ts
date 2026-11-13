import type { DemoFn, DemoParams } from './kit';

export type CategoryId = 'timing' | 'principes' | 'texte' | 'transitions' | 'rendu' | 'structure' | 'formats';

export const CATEGORIES: Array<{ id: CategoryId; label: string }> = [
  { id: 'timing', label: 'Timing & easing' },
  { id: 'principes', label: 'Principes d’animation' },
  { id: 'texte', label: 'Texte' },
  { id: 'transitions', label: 'Transitions' },
  { id: 'rendu', label: 'Rendu & style' },
  { id: 'structure', label: 'Structure' },
  { id: 'formats', label: 'Formats' }
];

export interface Term {
  id: string;
  name: string;
  /** Formes reconnues dans les réponses de l'IA pour rendre le terme cliquable. */
  aliases: string[];
  category: CategoryId;
  definition: string;
  whenToUse: string;
  mistake: string;
  /** Formulation exacte à utiliser dans un prompt pour Claude. */
  promptWord: string;
  params: DemoParams;
  demo: DemoFn;
}
