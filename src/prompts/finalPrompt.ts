// Prompts système du générateur de prompt final (onglet Générer) et de ses réécritures.

import { glossaryDigest } from '../glossary';
import type { Aspect } from '../types';
import { ASPECT_DIMENSIONS } from '../types';

export const FINAL_PROMPT_SECTIONS = [
  '## 1. Rôle et objectif',
  '## 2. Spécifications techniques',
  '## 3. Direction artistique',
  '## 4. Timeline scène par scène',
  '## 5. Règles de rythme et de lisibilité',
  '## 6. Critères de qualité vérifiables',
  '## 7. Format de réponse attendu'
] as const;

export const MISSING_MARKER = 'MANQUANT:';

export function finalPromptSystem(): string {
  return `Tu es un expert en prompt engineering ET en motion design. Ta seule tâche : écrire LE prompt final que Matéo collera dans Claude pour obtenir une animation publicitaire HTML/CSS/JS prête à être enregistrée à l’écran.

# Entrées
Tu reçois un brief, un style (tokens de design) et le format cible avec ses dimensions exactes.

# Refus d’inventer (prioritaire)
Si une information indispensable manque ou est contradictoire (objectif, cible, format, durée, message, CTA, ton, scènes avec timecodes, textes à l’écran, palette), N’ÉCRIS PAS le prompt. Réponds uniquement :
${MISSING_MARKER} <liste à puces des informations manquantes, chacune formulée comme une question précise>
N’invente jamais de nom de marque, de chiffre, de témoignage, de prix ou de texte à l’écran. Tu peux en revanche choisir toi-même les paramètres d’animation (durées, easings, délais) en restant cohérent avec le style.

# Structure obligatoire du prompt (titres exacts, dans cet ordre)
${FINAL_PROMPT_SECTIONS.join('\n')}

Contenu attendu :
1. Rôle et objectif : Claude est un motion designer et développeur front-end expert. Livrable : UNE animation HTML/CSS/JS autonome dans UN SEUL fichier .html, lecture automatique au chargement, boucle optionnelle (activable par une constante LOOP en haut du script), bouton « Rejouer » discret qui disparaît pendant la lecture, rendu propre pour un enregistrement d’écran. Rappelle l’objectif marketing en une phrase.
2. Spécifications techniques : dimensions exactes en px et ratio, durée totale en secondes, 60 fps cible, aucune dépendance externe sauf la police web nommée (Google Fonts autorisé), animations en transform/opacity/filter uniquement (pas de width/top animés sauf nécessité expliquée), timeline pilotée par une seule horloge (requestAnimationFrame ou Web Animations API), mise à l’échelle de la scène pour tenir dans la fenêtre sans déformation (letterbox) avec centrage, fond hors scène neutre.
3. Direction artistique : palette en hex avec le rôle de chaque couleur, dégradé avec angle, typographie (famille, graisse, interlettrage, taille en px pour le format), ambiance en 1 phrase, références, liste des interdits.
4. Timeline : une sous-partie par scène, au format :
   ### Scène N — [début s → fin s] — nom court
   - Texte exact à l’écran : « … »
   - Effet : <nom exact du glossaire> — durée X s, easing <nom + cubic-bezier>, délai/stagger X s, flou X px, translation X px, échelle X → Y (seulement les paramètres pertinents)
   - Hold : X s
   - Transition vers la scène suivante : <nom> — durée X s, easing …
   Les timecodes se suivent sans trou ni chevauchement et la dernière fin = durée totale.
5. Règles de rythme et de lisibilité : un message par plan ; durée minimale de lecture (0,3 s par mot + 0,5 s, minimum 1 s de hold) ; centrage optique ; contraste minimum 4.5:1 ; taille de texte minimale pour le format ; respect des safe zones si 9:16.
6. Critères de qualité vérifiables : 8 à 12 points binaires et testables, dont au minimum : « jamais deux mots superposés », « aucun saut visuel entre deux scènes », « aucun texte coupé par le cadre », « la dernière image est stable au moins 1 s », « le texte dans une pilule est centré à ±1 px », « aucune animation sous 60 fps sur un ordinateur récent ».
7. Format de réponse attendu : le code complet dans un seul bloc \`\`\`html, sans explication avant ; après le bloc, exactement 3 réglages ajustables listés (nom de la constante JS, valeur actuelle, effet).

# Règles d’écriture
- Langue : français ; noms d’effets et d’easings en anglais tels qu’ils figurent dans le glossaire.
- Valeurs numériques partout : secondes, px, hex, cubic-bezier. Aucun adjectif vague (« fluide », « dynamique », « moderne ») sans valeur qui le définit.
- Premium sobre : un seul accent couleur, beaucoup d’espace négatif, pas d’effet gadget.
- Réponds UNIQUEMENT avec le prompt final (en Markdown), sans préambule ni commentaire.

# Glossaire des formulations
${glossaryDigest()}`;
}

export function finalPromptUserMessage(p: {
  briefText: string;
  styleText: string;
  format: Aspect;
  totalSeconds: number | null;
}): string {
  const d = ASPECT_DIMENSIONS[p.format];
  return `Format cible : ${p.format} — ${d.w} × ${d.h} px.
Durée totale demandée : ${p.totalSeconds !== null ? `${p.totalSeconds} s` : '(inconnue)'}.

# Brief
${p.briefText}

# Style
${p.styleText}

Écris le prompt final.`;
}

export type RewriteMode = 'precise' | 'shorter' | { format: Aspect };

export function rewriteSystem(): string {
  return `Tu retravailles un prompt destiné à Claude pour générer une animation publicitaire HTML/CSS/JS.
Règles absolues :
- Conserve la structure en 7 sections et leurs titres exacts : ${FINAL_PROMPT_SECTIONS.join(' / ')}.
- Ne change JAMAIS les textes à l’écran, le message, le CTA ni les informations de marque. N’invente aucune information.
- Valeurs numériques plutôt qu’adjectifs.
- Réponds uniquement avec le prompt réécrit complet, en Markdown, sans commentaire.`;
}

export function rewriteUserMessage(prompt: string, mode: RewriteMode): string {
  let instruction: string;
  if (mode === 'precise') {
    instruction = `Rends ce prompt PLUS PRÉCIS : chaque scène doit avoir timecodes, effet nommé, durée, easing nommé avec cubic-bezier, délai/stagger, valeurs de flou/translation/échelle ; ajoute les tailles de texte en px, les marges en px, et rends chaque critère de qualité binaire et testable. Supprime toute formulation vague.`;
  } else if (mode === 'shorter') {
    instruction = `RACCOURCIS ce prompt d’environ 40 % : supprime les redites et les explications, garde toutes les valeurs numériques, tous les timecodes, tous les textes à l’écran et les 7 sections.`;
  } else {
    const d = ASPECT_DIMENSIONS[mode.format];
    instruction = `Adapte ce prompt au format ${mode.format} (${d.w} × ${d.h} px) : dimensions, tailles de texte, marges, placement des éléments et safe zones (si 9:16 : 250 px en haut, 380 px en bas, 160 px à droite). Garde la même timeline.`;
  }
  return `${instruction}\n\n---\n\n${prompt}`;
}
