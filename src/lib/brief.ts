import type { Aspect, Brief, BriefKey, Scene } from '../types';
import { ASPECTS } from '../types';
import { asNumber, asString, asStringArray, isRecord, uid } from './utils';

export function emptyBrief(): Brief {
  return {
    objective: '',
    target: '',
    platform: '',
    format: '',
    duration: '',
    message: '',
    cta: '',
    tone: '',
    references: '',
    styleId: null,
    styleNotes: '',
    scenes: [],
    onScreenTexts: []
  };
}

export function emptyScene(start: number | null = null, end: number | null = null): Scene {
  return { id: uid('sc_'), start, end, text: '', effect: '', transition: '' };
}

export const BRIEF_LABELS: Record<BriefKey, string> = {
  objective: 'Objectif',
  target: 'Cible',
  platform: 'Plateforme',
  format: 'Format',
  duration: 'Durée',
  message: 'Message unique',
  cta: 'Appel à l’action',
  tone: 'Ton',
  references: 'Références',
  styleId: 'Style',
  styleNotes: 'Style choisi (direction)',
  scenes: 'Scènes',
  onScreenTexts: 'Textes à l’écran'
};

export interface BriefIssue {
  key: BriefKey | 'scene';
  label: string;
}

/** Retourne la liste des manques bloquants pour générer un prompt final. */
export function briefIssues(brief: Brief): BriefIssue[] {
  const issues: BriefIssue[] = [];
  const required: BriefKey[] = ['objective', 'target', 'platform', 'format', 'duration', 'message', 'cta', 'tone'];
  for (const k of required) {
    const v = brief[k];
    if (typeof v !== 'string' || !v.trim()) issues.push({ key: k, label: `${BRIEF_LABELS[k]} manquant(e)` });
  }
  if (brief.scenes.length === 0) {
    issues.push({ key: 'scenes', label: 'Aucune scène définie' });
  } else {
    brief.scenes.forEach((s, i) => {
      const n = i + 1;
      if (s.start === null || s.end === null) issues.push({ key: 'scene', label: `Scène ${n} : timecodes début/fin manquants` });
      else if (s.end <= s.start) issues.push({ key: 'scene', label: `Scène ${n} : la fin doit être après le début` });
      if (!s.text.trim()) issues.push({ key: 'scene', label: `Scène ${n} : texte à l’écran manquant` });
      if (!s.effect.trim()) issues.push({ key: 'scene', label: `Scène ${n} : effet non nommé` });
    });
  }
  return issues;
}

export function briefProgress(brief: Brief): number {
  const keys: BriefKey[] = ['objective', 'target', 'platform', 'format', 'duration', 'message', 'cta', 'tone', 'references', 'styleNotes'];
  let filled = keys.filter((k) => {
    const v = brief[k];
    return typeof v === 'string' && v.trim().length > 0;
  }).length;
  if (brief.scenes.length > 0) filled += 1;
  if (brief.onScreenTexts.length > 0) filled += 1;
  return filled / (keys.length + 2);
}

export function totalSeconds(brief: Brief): number | null {
  const n = parseFloat(brief.duration.replace(',', '.'));
  if (Number.isFinite(n) && n > 0) return n;
  const ends = brief.scenes.map((s) => s.end).filter((e): e is number => e !== null);
  return ends.length ? Math.max(...ends) : null;
}

function parseAspect(v: unknown): Aspect | '' {
  const s = asString(v).replace(/\s/g, '').replace('x', ':');
  return (ASPECTS as string[]).includes(s) ? (s as Aspect) : '';
}

/** Mappe les clés françaises du bloc <brief> vers le modèle interne. */
export function briefPatchFromAI(raw: unknown): Partial<Brief> {
  if (!isRecord(raw)) return {};
  const patch: Partial<Brief> = {};
  const textMap: Array<[string, keyof Brief]> = [
    ['objectif', 'objective'],
    ['cible', 'target'],
    ['plateforme', 'platform'],
    ['duree', 'duration'],
    ['durée', 'duration'],
    ['message', 'message'],
    ['cta', 'cta'],
    ['ton', 'tone'],
    ['references', 'references'],
    ['références', 'references'],
    ['style', 'styleNotes']
  ];
  for (const [src, dst] of textMap) {
    if (src in raw) {
      const s = asString(raw[src]);
      if (s) (patch as Record<string, unknown>)[dst] = s;
    }
  }
  if ('format' in raw) {
    const a = parseAspect(raw.format);
    if (a) patch.format = a;
  }
  if (Array.isArray(raw.scenes)) {
    const scenes: Scene[] = raw.scenes.filter(isRecord).map((s) => ({
      id: uid('sc_'),
      start: asNumber(s.debut ?? s.début ?? s.start),
      end: asNumber(s.fin ?? s.end),
      text: asString(s.texte ?? s.text),
      effect: asString(s.effet ?? s.effect),
      transition: asString(s.transition)
    }));
    if (scenes.length) patch.scenes = scenes;
  }
  const texts = asStringArray(raw.textes_ecran ?? raw.textesEcran);
  if (texts.length) patch.onScreenTexts = texts;
  return patch;
}

export function applyBriefPatch(brief: Brief, patch: Partial<Brief>, locked: BriefKey[]): Brief {
  const next: Brief = { ...brief };
  (Object.keys(patch) as BriefKey[]).forEach((k) => {
    if (locked.includes(k)) return;
    (next as unknown as Record<string, unknown>)[k] = patch[k];
  });
  return next;
}

const BRIEF_OPEN = '<brief>';
const BRIEF_CLOSE = '</brief>';

/**
 * Sépare le texte visible du bloc <brief>{json}</brief> ajouté par le directeur artistique.
 * Pendant le streaming, tout ce qui suit "<brief>" est masqué.
 */
export function splitBriefBlock(text: string): { visible: string; patch: Partial<Brief> | null } {
  const start = text.indexOf(BRIEF_OPEN);
  if (start === -1) {
    // masque un début de balise en cours de streaming (ex. "<bri")
    const partial = text.lastIndexOf('<');
    if (partial !== -1 && BRIEF_OPEN.startsWith(text.slice(partial))) {
      return { visible: text.slice(0, partial).trimEnd(), patch: null };
    }
    return { visible: text, patch: null };
  }
  const visible = text.slice(0, start).trimEnd();
  const end = text.indexOf(BRIEF_CLOSE, start);
  if (end === -1) return { visible, patch: null };
  const body = text.slice(start + BRIEF_OPEN.length, end).trim();
  try {
    return { visible, patch: briefPatchFromAI(JSON.parse(body)) };
  } catch {
    return { visible, patch: null };
  }
}

/** Représentation compacte du brief transmise aux prompts système. */
export function briefForAI(brief: Brief, styleName?: string): string {
  const lines: string[] = [];
  const add = (label: string, v: string) => lines.push(`- ${label} : ${v.trim() ? v.trim() : '(inconnu)'}`);
  add('Objectif', brief.objective);
  add('Cible', brief.target);
  add('Plateforme', brief.platform);
  add('Format', brief.format);
  add('Durée', brief.duration ? `${brief.duration}` : '');
  add('Message unique', brief.message);
  add('Appel à l’action', brief.cta);
  add('Ton', brief.tone);
  add('Références', brief.references);
  add('Style de la bibliothèque', styleName ?? '');
  add('Direction créative retenue', brief.styleNotes);
  if (brief.scenes.length) {
    lines.push('- Scènes :');
    brief.scenes.forEach((s, i) => {
      lines.push(
        `  ${i + 1}. [${s.start ?? '?'} s → ${s.end ?? '?'} s] texte « ${s.text || '?'} » ; effet : ${s.effect || '?'} ; transition : ${s.transition || '?'}`
      );
    });
  } else {
    lines.push('- Scènes : (aucune)');
  }
  lines.push(`- Textes à l’écran : ${brief.onScreenTexts.length ? brief.onScreenTexts.map((t) => `« ${t} »`).join(', ') : '(aucun)'}`);
  return lines.join('\n');
}
