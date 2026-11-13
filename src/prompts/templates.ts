// Générateur de prompt « par gabarit » (mode hors ligne, sans IA) et correcteur de rendu par règles.

import { TERM_REGEX, getTerm, termIdForAlias, type Term } from '../glossary';
import { totalSeconds } from '../lib/brief';
import type { Aspect, Brief, Scene, StyleTokens } from '../types';
import { ASPECT_DIMENSIONS } from '../types';
import { FINAL_PROMPT_SECTIONS } from './finalPrompt';

export interface TemplateOptions {
  format: Aspect;
  /** Ajoute le minutage mot par mot et les tailles en px. */
  precise?: boolean;
  /** Version courte, sans explications. */
  compact?: boolean;
}

function findTerm(effect: string): Term | undefined {
  TERM_REGEX.lastIndex = 0;
  const m = TERM_REGEX.exec(effect);
  TERM_REGEX.lastIndex = 0;
  if (!m?.[1]) return undefined;
  const id = termIdForAlias(m[1]);
  return id ? getTerm(id) : undefined;
}

function easingOf(style: StyleTokens | undefined, term: Term | undefined): string {
  if (term && term.params.easingCss.startsWith('cubic-bezier')) return `${term.params.easingName} — ${term.params.easingCss}`;
  return style?.easing || 'expo out — cubic-bezier(0.16, 1, 0.3, 1)';
}

function fmt(n: number): string {
  return `${String(Math.round(n * 100) / 100).replace('.', ',')} s`;
}

function sceneBlock(s: Scene, i: number, next: Scene | undefined, style: StyleTokens | undefined, opts: TemplateOptions, dims: { w: number; h: number }): string {
  const term = findTerm(s.effect);
  const start = s.start ?? 0;
  const end = s.end ?? start;
  const len = Math.max(0, end - start);
  const effectDur = term ? Math.min(term.params.duration, Math.max(0.2, len * 0.45)) : Math.min(0.6, Math.max(0.2, len * 0.4));
  const words = s.text.split(/\s+/).filter(Boolean);
  const wordInterval = style?.rhythm.wordInterval ?? 0.1;
  const appearEnd = effectDur + (words.length > 1 ? (words.length - 1) * wordInterval : 0);
  const transitionName = s.transition || next?.transition || style?.transitions[0] || 'cut sec';
  const transitionDur = next ? Math.min(0.6, len * 0.25) : 0;
  const hold = Math.max(0, len - appearEnd - transitionDur);
  const lines = [
    `### Scène ${i + 1} — [${fmt(start)} → ${fmt(end)}]`,
    `- Texte exact à l’écran : « ${s.text} »`,
    `- Effet : ${term ? term.name : s.effect} — durée ${fmt(effectDur)}, easing ${easingOf(style, term)}${words.length > 1 ? `, stagger ${fmt(wordInterval)} par mot` : ''}${term && term.params.extra ? `, ${term.params.extra.map(([k, v]) => `${k.toLowerCase()} ${v}`).join(', ')}` : ''}`,
    ...(term && !opts.compact ? [`  (formulation de référence : ${term.promptWord})`] : []),
    `- Hold : ${fmt(hold)}${hold < 1 && !opts.compact ? ' (attention : hold court, vérifier la lisibilité)' : ''}`,
    next ? `- Transition vers la scène ${i + 2} : ${transitionName} — durée ${fmt(transitionDur)}, easing expo in-out — cubic-bezier(0.87, 0, 0.13, 1)` : '- Fin : dernière image stable, pas de transition de sortie.'
  ];
  if (opts.precise && words.length > 0) {
    const size = Math.round(Math.min(dims.w, dims.h) * (words.length <= 3 ? 0.11 : 0.075));
    lines.push(`- Taille du texte : ${size} px, centré horizontalement et verticalement (centrage optique −2 % en y)`);
    lines.push(
      `- Minutage mot par mot : ${words
        .map((w, k) => `« ${w} » à ${fmt(start + k * wordInterval)}`)
        .join(' · ')}`
    );
  }
  return lines.join('\n');
}

export function buildTemplatePrompt(brief: Brief, style: StyleTokens | undefined, opts: TemplateOptions): string {
  const dims = ASPECT_DIMENSIONS[opts.format];
  const total = totalSeconds(brief) ?? 15;
  const scenes = [...brief.scenes].sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
  const t = style?.typography;
  const out: string[] = [];

  out.push(FINAL_PROMPT_SECTIONS[0]);
  out.push(
    opts.compact
      ? `Tu es un motion designer et développeur front-end expert. Crée une animation publicitaire en UN SEUL fichier HTML/CSS/JS autonome : lecture automatique, constante LOOP (false par défaut), bouton « Rejouer » discret masqué pendant la lecture, rendu propre pour un enregistrement d’écran. Objectif : ${brief.objective}.`
      : `Tu es un motion designer et développeur front-end expert. Ta mission : créer une animation publicitaire livrée en UN SEUL fichier .html autonome (HTML + CSS + JS), qui démarre automatiquement au chargement, propose une boucle optionnelle via une constante \`LOOP\` (false par défaut) en haut du script, et un bouton « Rejouer » discret qui disparaît pendant la lecture. Le rendu doit être propre pour un enregistrement d’écran.\n\nObjectif marketing : ${brief.objective}. Cible : ${brief.target}. Plateforme : ${brief.platform}. Message unique à retenir : « ${brief.message} ». Ton : ${brief.tone}.`
  );

  out.push('', FINAL_PROMPT_SECTIONS[1]);
  out.push(
    [
      `- Format ${opts.format} : scène de ${dims.w} × ${dims.h} px exactement.`,
      `- Durée totale : ${fmt(total)}.`,
      '- 60 fps cible : animer uniquement transform, opacity et filter ; une seule horloge (requestAnimationFrame ou Web Animations API) pilote toute la timeline.',
      `- Aucune dépendance externe${t?.family ? `, sauf la police web « ${t.family} » (Google Fonts)` : ''}.`,
      '- Redimensionnement : la scène est mise à l’échelle pour tenir dans la fenêtre sans déformation, centrée, fond hors scène neutre ; recalcul au resize.',
      ...(opts.compact ? [] : ['- Le code doit rester lisible : constantes de timing regroupées en haut du script.'])
    ].join('\n')
  );

  out.push('', FINAL_PROMPT_SECTIONS[2]);
  const da: string[] = [];
  if (style) {
    da.push(`- Palette : ${style.palette.map((c) => `${c.name} ${c.hex}`).join(' · ')}.`);
    if (style.gradient) da.push(`- Accent unique en dégradé : ${style.gradient.stops.join(' → ')} à ${style.gradient.angle}°.`);
    da.push(`- Typographie : ${style.typography.family} ${style.typography.weight}, interlettrage ${style.typography.letterSpacing}.${style.typography.notes ? ` ${style.typography.notes}` : ''}`);
    if (style.signatureEffects.length && !opts.compact) da.push(`- Effets signature du style :\n${style.signatureEffects.map((e) => `  - ${e}`).join('\n')}`);
    da.push(`- Easing principal : ${style.easing}.`);
  } else {
    da.push('- Palette : (aucun style sélectionné — choisis un style dans l’onglet Styles).');
  }
  da.push(`- Ambiance : ${brief.tone}${brief.styleNotes ? ` — ${brief.styleNotes}` : ''}.`);
  if (brief.references) da.push(`- Références : ${brief.references}.`);
  if (style?.forbidden.length) da.push(`- Interdits : ${style.forbidden.join(' ; ')}.`);
  out.push(da.join('\n'));

  out.push('', FINAL_PROMPT_SECTIONS[3]);
  scenes.forEach((s, i) => {
    out.push(sceneBlock(s, i, scenes[i + 1], style, opts, dims));
    out.push('');
  });
  if (brief.cta && !scenes.some((s) => s.text.includes(brief.cta))) {
    out.push(`(Le CTA « ${brief.cta} » doit apparaître dans la dernière scène.)`, '');
  }

  out.push(FINAL_PROMPT_SECTIONS[4]);
  out.push(
    [
      '- Un seul message par plan ; jamais deux phrases à l’écran en même temps.',
      '- Durée minimale de lecture : 0,3 s par mot + 0,5 s, et au moins 1 s de hold sur le message clé.',
      '- Centrage optique parfait du texte (horizontal et vertical), y compris dans les pilules.',
      '- Contraste texte/fond ≥ 4.5:1.',
      `- Taille de texte minimale : ${Math.round(Math.min(dims.w, dims.h) * 0.045)} px.`,
      ...(opts.format === '9:16' ? ['- Safe zones 9:16 : aucun texte dans les 250 px du haut, les 380 px du bas et les 160 px de droite.'] : []),
      ...(style ? [`- Rythme du style : ${style.rhythm.sceneDuration}, un mot toutes les ${fmt(style.rhythm.wordInterval)}.`] : [])
    ].join('\n')
  );

  out.push('', FINAL_PROMPT_SECTIONS[5]);
  out.push(
    [
      '- [ ] Jamais deux mots superposés, même pendant une transition.',
      '- [ ] Aucun saut visuel entre deux scènes (pas d’image vide, pas de clignotement).',
      '- [ ] Aucun texte coupé par le bord du cadre.',
      '- [ ] Chaque scène respecte ses timecodes à ±0,05 s.',
      '- [ ] Le texte dans une pilule est centré à ±1 px.',
      '- [ ] La dernière image reste stable au moins 1 s.',
      '- [ ] Animation fluide à 60 fps sur un ordinateur récent.',
      '- [ ] Le bouton « Rejouer » relance la timeline depuis 0 sans rechargement.',
      ...(style?.forbidden.length ? style.forbidden.map((f) => `- [ ] Respecte l’interdit : ${f}.`) : [])
    ].join('\n')
  );

  out.push('', FINAL_PROMPT_SECTIONS[6]);
  out.push(
    'Réponds avec le code complet dans un seul bloc ```html, sans explication avant. Après le bloc, liste exactement 3 réglages ajustables (nom de la constante JS, valeur actuelle, effet).'
  );
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

// ───────────── Correcteur de rendu hors ligne ─────────────

interface FixRule {
  test: RegExp;
  problem: string;
  change: string;
}

const FIX_RULES: FixRule[] = [
  {
    test: /lent|mou|long|traîne|ennuy/i,
    problem: 'Le rythme est trop lent.',
    change: 'Réduire toutes les durées d’animation de 35 % ; holds ramenés à 0,6–0,8 s ; stagger entre mots ramené à 0,08 s ; easing expo out cubic-bezier(0.16, 1, 0.3, 1).'
  },
  {
    test: /rapide|vite|pas le temps|illisible|trop court/i,
    problem: 'Le rythme est trop rapide pour être lu.',
    change: 'Allonger les holds à 0,3 s par mot + 0,5 s (minimum 1 s) ; garder les durées d’entrée identiques.'
  },
  {
    test: /flou|blur/i,
    problem: 'Le flou est trop présent ou dure trop longtemps.',
    change: 'Flou initial du blur-to-sharp reveal : 12 px maximum ; durée du passage flou → net : 0,45 s ; plus aucun flou pendant le hold.'
  },
  {
    test: /superpos|chevauch|se mélang|overlap/i,
    problem: 'Des mots se superposent.',
    change: 'Chaque mot sortant termine sa sortie (opacité 0) avant l’entrée du suivant : délai d’entrée ≥ durée de sortie (0,2 s) ; jamais deux textes visibles en même temps dans la même zone.'
  },
  {
    test: /centr|décal|aligne/i,
    problem: 'Le texte n’est pas centré.',
    change: 'Centrer avec display:grid; place-items:center ; mesurer la largeur réelle du texte (getBoundingClientRect) pour dimensionner les pilules ; tolérance ±1 px.'
  },
  {
    test: /saccad|lag|rame|fps|freeze|bug/i,
    problem: 'L’animation saccade.',
    change: 'Animer uniquement transform, opacity et filter ; ajouter will-change sur les éléments animés ; flous limités à 20 px ; une seule boucle requestAnimationFrame.'
  },
  {
    test: /saut|clignot|flash|coupure|vide/i,
    problem: 'Un saut visuel apparaît entre deux scènes.',
    change: 'Faire chevaucher la transition de 0,1 s avec la scène suivante ; fill-mode both sur toutes les animations ; aucune image vide entre deux scènes.'
  },
  {
    test: /petit|grand|taille|gros/i,
    problem: 'La taille du texte ne convient pas.',
    change: 'Ajuster la taille du texte principal à 9–11 % du petit côté de la scène, et 4,5 % minimum pour le texte secondaire.'
  },
  {
    test: /couleur|terne|fade|criard|saturé/i,
    problem: 'Les couleurs ne correspondent pas à la direction.',
    change: 'Revenir strictement à la palette du style ; le dégradé d’accent n’apparaît que sur un seul élément par scène.'
  },
  {
    test: /fin|cta|bouton|appel/i,
    problem: 'La fin ou le CTA manque d’impact.',
    change: 'Le CTA apparaît seul à l’écran, en pilule avec le dégradé d’accent, overshoot léger (back out cubic-bezier(0.34, 1.56, 0.64, 1), 0,6 s), puis hold de 1,5 s.'
  }
];

export function buildOfflineFix(feedback: string): { ok: boolean; text: string } {
  const matched = FIX_RULES.filter((r) => r.test.test(feedback));
  if (matched.length === 0) {
    return {
      ok: false,
      text: 'Je n’ai pas reconnu de problème précis dans ce retour. Précise la scène (timecode) et la nature du souci : vitesse, flou, superposition, centrage, saccades, saut visuel, taille, couleurs ou CTA.'
    };
  }
  const lines: string[] = ['## Corrections à appliquer'];
  matched.forEach((r, i) => {
    lines.push(`${i + 1}. ${r.problem}`, `   - Changement : ${r.change}`);
  });
  lines.push(
    '',
    `Retour d’origine : « ${feedback.trim()} »`,
    '',
    '## À ne pas modifier',
    '- Les textes à l’écran, la palette, la typographie, l’ordre des scènes et la durée totale.',
    '',
    '## Vérification',
    '- [ ] Le problème signalé n’est plus visible.',
    '- [ ] Jamais deux mots superposés.',
    '- [ ] Aucun saut visuel entre deux scènes.',
    '',
    '## Format de réponse attendu',
    'Le fichier HTML complet corrigé en un seul bloc, sans explication, puis la liste des constantes modifiées.'
  );
  return { ok: true, text: lines.join('\n') };
}
