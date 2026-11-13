import type { Aspect, StyleTokens } from '../types';
import { ASPECTS } from '../types';
import { blankStyle } from './defaultStyle';
import { asNumber, asString, asStringArray, isRecord, uid } from './utils';

const HEX = /^#[0-9a-f]{6}$/i;

function normHex(v: unknown): string | null {
  const s = asString(v).toLowerCase();
  if (HEX.test(s)) return s;
  const short = s.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  return null;
}

/** Valide et normalise les tokens renvoyés par l'importateur de style. */
export function styleFromAI(raw: unknown): { style: StyleTokens; questions: string[] } {
  if (!isRecord(raw)) throw new Error('Réponse inattendue : objet JSON attendu.');
  const base = blankStyle(asString(raw.name, 'Style importé') || 'Style importé');
  const palette = Array.isArray(raw.palette)
    ? raw.palette
        .filter(isRecord)
        .map((c) => ({ name: asString(c.name, 'Couleur'), hex: normHex(c.hex) }))
        .filter((c): c is { name: string; hex: string } => c.hex !== null)
    : [];
  let gradient: StyleTokens['gradient'] = null;
  if (isRecord(raw.gradient)) {
    const stops = asStringArray(raw.gradient.stops).map(normHex).filter((x): x is string => x !== null);
    if (stops.length >= 2) gradient = { stops, angle: asNumber(raw.gradient.angle) ?? 100 };
  }
  const typo = isRecord(raw.typography) ? raw.typography : {};
  const rhythm = isRecord(raw.rhythm) ? raw.rhythm : {};
  const formats = asStringArray(raw.formats).filter((f): f is Aspect => (ASPECTS as string[]).includes(f));
  const now = Date.now();
  const style: StyleTokens = {
    ...base,
    id: uid('st_'),
    description: asString(raw.description),
    palette,
    gradient,
    typography: {
      family: asString(typo.family),
      weight: asNumber(typo.weight) ?? 600,
      letterSpacing: asString(typo.letterSpacing, '0em') || '0em',
      notes: asString(typo.notes)
    },
    signatureEffects: asStringArray(raw.signatureEffects),
    transitions: asStringArray(raw.transitions),
    rhythm: {
      totalDuration: asNumber(rhythm.totalDuration) ?? 15,
      sceneDuration: asString(rhythm.sceneDuration),
      wordInterval: asNumber(rhythm.wordInterval) ?? 0.12,
      notes: asString(rhythm.notes)
    },
    easing: asString(raw.easing),
    formats: formats.length ? formats : ['9:16'],
    forbidden: asStringArray(raw.forbidden),
    createdAt: now,
    updatedAt: now
  };
  return { style, questions: asStringArray(raw.questions) };
}
