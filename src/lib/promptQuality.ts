import { FINAL_PROMPT_SECTIONS } from '../prompts/finalPrompt';
import type { Brief } from '../types';
import { briefIssues } from './brief';

export interface QualityCheck {
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
}

const EASING_RE = /(cubic-bezier|ease-in|ease-out|ease-in-out|expo|spring|back out|linear|overshoot)/i;
const TIMECODE_RE = /\d+(?:[.,]\d+)?\s*s?\s*(?:→|->|–|-|à)\s*\d+(?:[.,]\d+)?\s*s/i;
const EFFECT_RE = /effet\s*:/i;

/** Découpe la section 4 en blocs de scène. */
function sceneBlocks(prompt: string): string[] {
  const start = prompt.indexOf('## 4.');
  if (start === -1) return [];
  const after = prompt.slice(start);
  const end = after.indexOf('## 5.');
  const section = end === -1 ? after : after.slice(0, end);
  return section
    .split(/\n(?=#{2,4}\s*(?:Scène|Scene|Plan)\s*\d+)/i)
    .slice(1)
    .map((b) => b.trim());
}

export function analyzePrompt(prompt: string, brief: Brief): QualityCheck[] {
  const checks: QualityCheck[] = [];
  const issues = briefIssues(brief);
  checks.push({
    id: 'brief',
    label: 'Le brief est complet',
    ok: issues.length === 0,
    detail: issues.length ? issues.map((i) => i.label).join(' · ') : undefined
  });
  const missingSections = FINAL_PROMPT_SECTIONS.filter((s) => !prompt.includes(s.slice(3, 8)) || !prompt.includes(s.slice(3)));
  checks.push({
    id: 'sections',
    label: 'Les 7 sections sont présentes',
    ok: missingSections.length === 0,
    detail: missingSections.length ? `Manque : ${missingSections.map((s) => s.slice(3)).join(', ')}` : undefined
  });
  const blocks = sceneBlocks(prompt);
  checks.push({ id: 'scenes', label: 'La timeline contient des scènes', ok: blocks.length > 0, detail: blocks.length ? `${blocks.length} scène(s)` : undefined });
  const noTc = blocks.map((b, i) => (TIMECODE_RE.test(b) ? 0 : i + 1)).filter(Boolean);
  checks.push({ id: 'timecodes', label: 'Chaque scène a un timecode', ok: blocks.length > 0 && noTc.length === 0, detail: noTc.length ? `Scène(s) ${noTc.join(', ')}` : undefined });
  const noFx = blocks.map((b, i) => (EFFECT_RE.test(b) ? 0 : i + 1)).filter(Boolean);
  checks.push({ id: 'effects', label: 'Chaque scène a un effet nommé', ok: blocks.length > 0 && noFx.length === 0, detail: noFx.length ? `Scène(s) ${noFx.join(', ')}` : undefined });
  const noEase = blocks.map((b, i) => (EASING_RE.test(b) ? 0 : i + 1)).filter(Boolean);
  checks.push({ id: 'easing', label: 'Chaque scène a un easing nommé', ok: blocks.length > 0 && noEase.length === 0, detail: noEase.length ? `Scène(s) ${noEase.join(', ')}` : undefined });
  checks.push({ id: 'hex', label: 'La palette est donnée en hex', ok: /#[0-9a-f]{6}\b/i.test(prompt) });
  checks.push({ id: 'dims', label: 'Les dimensions exactes sont indiquées', ok: /\d{3,4}\s*[×x]\s*\d{3,4}\s*px/i.test(prompt) });
  checks.push({ id: 'fps', label: '60 fps est demandé', ok: /60\s*fps/i.test(prompt) });
  const vague = prompt.match(/\b(fluide|dynamique|moderne|stylé|sympa|joli)\b/gi) ?? [];
  checks.push({
    id: 'vague',
    label: 'Pas d’adjectif vague sans valeur',
    ok: vague.length <= 1,
    detail: vague.length > 1 ? `Trouvé : ${Array.from(new Set(vague.map((v) => v.toLowerCase()))).join(', ')}` : undefined
  });
  return checks;
}

/** Checklist adaptée aux prompts de correction (retour de rendu). */
export function analyzeCorrection(prompt: string): QualityCheck[] {
  return [
    { id: 'fixes', label: 'Section « Corrections à appliquer »', ok: /corrections? à appliquer/i.test(prompt) },
    { id: 'values', label: 'Des valeurs chiffrées (s, px, cubic-bezier)', ok: /\d+(?:[.,]\d+)?\s*(s|px|%)\b|cubic-bezier/i.test(prompt) },
    { id: 'keep', label: 'Ce qu’il ne faut pas modifier est précisé', ok: /ne pas modifier/i.test(prompt) },
    { id: 'verify', label: 'Critères de vérification', ok: /vérification/i.test(prompt) },
    { id: 'format', label: 'Format de réponse attendu', ok: /format de réponse/i.test(prompt) }
  ];
}
