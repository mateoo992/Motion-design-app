import type { StyleTokens } from '../types';

/** Représentation texte d'un style, injectée dans les prompts. */
export function styleForAI(s: StyleTokens | undefined | null): string {
  if (!s) return '(aucun style sélectionné)';
  const list = (arr: string[]) => (arr.length ? arr.map((x) => `  - ${x}`).join('\n') : '  - (non défini)');
  return [
    `Nom : ${s.name}`,
    s.description ? `Description : ${s.description}` : '',
    `Palette :\n${s.palette.map((c) => `  - ${c.name} : ${c.hex}`).join('\n') || '  - (non définie)'}`,
    s.gradient ? `Dégradé d’accent : ${s.gradient.stops.join(' → ')} à ${s.gradient.angle}°` : 'Dégradé d’accent : aucun',
    `Typographie : ${s.typography.family} ${s.typography.weight}, interlettrage ${s.typography.letterSpacing}${s.typography.notes ? ` — ${s.typography.notes}` : ''}`,
    `Effets signature :\n${list(s.signatureEffects)}`,
    `Transitions :\n${list(s.transitions)}`,
    `Rythme : ${s.rhythm.totalDuration} s au total, ${s.rhythm.sceneDuration}, un mot toutes les ${s.rhythm.wordInterval} s${s.rhythm.notes ? ` — ${s.rhythm.notes}` : ''}`,
    `Easing principal : ${s.easing}`,
    `Formats : ${s.formats.join(', ')}`,
    `Interdits :\n${list(s.forbidden)}`
  ]
    .filter(Boolean)
    .join('\n');
}
