import { MOTION_TERMS } from './terms-motion';
import { RENDER_TERMS } from './terms-render';
import { TEXT_TERMS } from './terms-text';
import type { Term } from './types';
import { normalize } from '../lib/utils';

export * from './types';
export type { DemoParams } from './kit';

export const TERMS: Term[] = [...MOTION_TERMS, ...TEXT_TERMS, ...RENDER_TERMS];

const BY_ID = new Map(TERMS.map((t) => [t.id, t]));

export function getTerm(id: string): Term | undefined {
  return BY_ID.get(id);
}

export function searchTerms(query: string): Term[] {
  const q = normalize(query.trim());
  if (!q) return TERMS;
  return TERMS.filter((t) =>
    normalize([t.name, ...t.aliases, t.definition, t.promptWord].join(' ')).includes(q)
  );
}

interface AliasEntry {
  alias: string;
  id: string;
}

const ALIASES: AliasEntry[] = TERMS.flatMap((t) => [t.name, ...t.aliases].map((alias) => ({ alias, id: t.id })))
  .filter((a) => a.alias.length >= 3 || /\d/.test(a.alias))
  .sort((a, b) => b.alias.length - a.alias.length);

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Regex qui repère les termes du glossaire dans un texte libre (insensible à la casse). */
export const TERM_REGEX = new RegExp(
  `(?<![\\p{L}\\p{N}])(${ALIASES.map((a) => escape(a.alias)).join('|')})(?![\\p{L}\\p{N}])`,
  'giu'
);

const ALIAS_LOOKUP = new Map(ALIASES.map((a) => [a.alias.toLowerCase(), a.id]));

export function termIdForAlias(alias: string): string | undefined {
  return ALIAS_LOOKUP.get(alias.toLowerCase());
}

/** Liste compacte des formulations « prompt » du glossaire, injectée dans les prompts système. */
export function glossaryDigest(): string {
  return TERMS.map((t) => `- ${t.name} : ${t.promptWord}`).join('\n');
}
