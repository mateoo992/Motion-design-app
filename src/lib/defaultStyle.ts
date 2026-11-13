import type { StyleTokens } from '../types';

export const TEMPLATE_1_ID = 'style-template-1-blanc';

export function template1Blanc(): StyleTokens {
  const now = Date.now();
  return {
    id: TEMPLATE_1_ID,
    name: 'Template 1 blanc',
    description:
      'Premium sobre sur fond blanc : encre profonde, un seul accent en dégradé bleu → rose → orange, halos striés façon verre cannelé, rythme rapide et nerveux.',
    builtin: true,
    palette: [
      { name: 'Fond', hex: '#ffffff' },
      { name: 'Encre (texte)', hex: '#0d0d14' },
      { name: 'Gris secondaire', hex: '#8a8c99' },
      { name: 'Accent bleu', hex: '#3d7bff' },
      { name: 'Accent rose', hex: '#ff3d9a' },
      { name: 'Accent orange', hex: '#ff8a3d' }
    ],
    gradient: { stops: ['#3d7bff', '#ff3d9a', '#ff8a3d'], angle: 100 },
    typography: {
      family: 'Figtree',
      weight: 700,
      letterSpacing: '-0.035em',
      notes: 'Grotesque géométrique grasse. Un message par plan, mots courts, centrage optique parfait.'
    },
    signatureEffects: [
      'Texte flou → net mot par mot (blur 12 px → 0, opacité 0 → 1, translateY 12 px → 0, 0,45 s expo out, stagger 0,1 s)',
      'Morphing pilule → carte (maquette de site) avec halo strié derrière (0,8 s expo out)',
      'Pilule élastique : les mots se remplacent sans jamais se superposer (sortie complète avant entrée, largeur animée en spring)',
      'Compteur de chiffre clé au-dessus de barres en dégradé (comptage 1,2 s expo out, barres en stagger 0,08 s)',
      'Signature de marque flou → net en fin de vidéo (0,7 s expo out)',
      'Halos en dégradé flouté (blur 60–80 px) masqués par bandes verticales douces (effet verre cannelé)'
    ],
    transitions: ['Balayage vertical du dégradé strié (wipe vertical, ~0,6 s, expo in-out)'],
    rhythm: {
      totalDuration: 13,
      sceneDuration: '2–3 s par scène',
      wordInterval: 0.1,
      notes: 'Rythme rapide : un nouveau mot toutes les ~0,1 s, aucune scène au-delà de 3 s.'
    },
    easing: 'expo out — cubic-bezier(0.16, 1, 0.3, 1)',
    formats: ['9:16', '4:5', '1:1', '16:9'],
    forbidden: [
      'Rythme lent (scène > 3 s, mots espacés de plus de 0,2 s)',
      'Listes qui défilent avec un focus (trop générique)',
      'Texte mal centré dans les pilules',
      'Plus d’une couleur d’accent'
    ],
    createdAt: now,
    updatedAt: now
  };
}

export function blankStyle(name = 'Nouveau style'): Omit<StyleTokens, 'id'> {
  const now = Date.now();
  return {
    name,
    description: '',
    builtin: false,
    palette: [
      { name: 'Fond', hex: '#ffffff' },
      { name: 'Texte', hex: '#0d0d14' }
    ],
    gradient: null,
    typography: { family: 'Inter', weight: 600, letterSpacing: '-0.02em', notes: '' },
    signatureEffects: [],
    transitions: [],
    rhythm: { totalDuration: 15, sceneDuration: '2–3 s par scène', wordInterval: 0.12, notes: '' },
    easing: 'expo out — cubic-bezier(0.16, 1, 0.3, 1)',
    formats: ['9:16'],
    forbidden: [],
    createdAt: now,
    updatedAt: now
  };
}
