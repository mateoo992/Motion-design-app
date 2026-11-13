import { BG, EASE, GRADIENT, INK, MUTED, SURFACE, el, kit, label, layer, textStyle } from './kit';
import type { Term } from './types';

const panel = (parent: HTMLElement, bg: string, text: string, color = INK) =>
  el(
    parent,
    `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:${bg};${textStyle(7, 700, color)}`,
    text
  );

export const TEXT_TERMS: Term[] = [
  // ───────────── Texte ─────────────
  {
    id: 'kinetic-typography',
    name: 'Kinetic typography',
    aliases: ['kinetic typography', 'kinetic type', 'typographie cinétique'],
    category: 'texte',
    definition:
      'Le texte devient l’acteur principal : les mots bougent, changent de taille et de position au rythme du message. La typographie porte l’émotion à elle seule.',
    whenToUse: 'Pour une pub sans images, un manifeste de marque ou une accroche percutante en 3 mots.',
    mistake: 'Animer chaque mot différemment : sans règle commune, le résultat devient illisible et brouillon.',
    promptWord: 'kinetic typography (1 mot = 1 mouvement, cadence 0,4 s, expo out)',
    params: { duration: 0.4, easingName: 'expo out', easingCss: EASE.expoOut, delay: 0.4, extra: [['Mots', '3']] },
    demo: (ctx) => {
      const k = kit(ctx);
      const L = layer(k.stage);
      const words: Array<[string, Keyframe[]]> = [
        ['Vite.', [{ transform: 'scale(2.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }]],
        ['Simple.', [{ transform: 'translateX(60cqw)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }]],
        ['Beau.', [{ transform: 'rotate(-90deg) translateY(-20cqw)', opacity: 0 }, { transform: 'rotate(0) translateY(0)', opacity: 1 }]]
      ];
      const step = k.p.duration + k.p.delay;
      words.forEach(([w, kf], i) => {
        const e = el(L, `position:absolute;${textStyle(12)}`, w);
        k.a(e, kf, { duration: k.p.duration, easing: k.p.easingCss, delay: 0.2 + i * step });
        if (i < words.length - 1)
          k.a(e, [{ opacity: 1 }, { opacity: 0 }], { duration: 0.12, delay: 0.2 + (i + 1) * step - 0.06, fill: 'forwards' });
      });
      return k.done();
    }
  },
  {
    id: 'blur-reveal',
    name: 'Blur-to-sharp reveal',
    aliases: ['blur-to-sharp', 'blur to sharp', 'blur reveal', 'flou → net', 'flou vers net'],
    category: 'texte',
    definition:
      'Le texte apparaît flou et transparent puis devient net. L’effet imite une mise au point d’objectif : doux, haut de gamme, très lisible.',
    whenToUse: 'Pour les titres et signatures de marque dans un style premium et sobre.',
    mistake: 'Un flou de départ trop faible (2–4 px) : on ne perçoit pas l’effet. Ou une durée > 1 s qui rend la lecture pénible.',
    promptWord: 'blur-to-sharp reveal (blur 12 px → 0, opacité 0 → 1, 0,6 s expo out)',
    params: { duration: 0.6, easingName: 'expo out', easingCss: EASE.expoOut, delay: 0.25, extra: [['Flou initial', '12 px']] },
    demo: (ctx) => {
      const k = kit(ctx);
      const L = layer(k.stage);
      const t = el(L, textStyle(9.5), 'Net. Précis.');
      k.a(t, [{ filter: 'blur(12px)', opacity: 0, transform: 'scale(1.04)' }, { filter: 'blur(0px)', opacity: 1, transform: 'scale(1)' }], {
        duration: k.p.duration,
        easing: k.p.easingCss,
        delay: k.p.delay
      });
      return k.done();
    }
  },
  {
    id: 'mask-reveal',
    name: 'Mask reveal',
    aliases: ['mask reveal', 'masque', 'reveal par masque'],
    category: 'texte',
    definition:
      'Le texte glisse depuis derrière une limite invisible (un masque) : on le voit apparaître comme s’il sortait d’une fente. Rien ne dépasse du cadre du masque.',
    whenToUse: 'Pour des titres très éditoriaux, des lignes qui se dévoilent l’une après l’autre.',
    mistake: 'Oublier le masque : le texte glisse dans le vide et l’effet devient un simple “slide”.',
    promptWord: 'mask reveal vertical (translateY 110 % → 0 dans un conteneur overflow:hidden, 0,7 s expo out)',
    params: { duration: 0.7, easingName: 'expo out', easingCss: EASE.expoOut, delay: 0.12, extra: [['Lignes', '2']] },
    demo: (ctx) => {
      const k = kit(ctx);
      const L = layer(k.stage, 'flex-direction:column;gap:.6cqw;');
      ['Votre site,', 'en 7 jours.'].forEach((line, i) => {
        const mask = el(L, 'overflow:hidden;padding:0 1cqw;');
        const t = el(mask, `display:block;${textStyle(9)}`, line);
        k.a(t, [{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }], {
          duration: k.p.duration,
          easing: k.p.easingCss,
          delay: 0.25 + i * k.p.delay
        });
      });
      return k.done();
    }
  },
  {
    id: 'word-by-word',
    name: 'Word-by-word',
    aliases: ['word-by-word', 'word by word', 'mot par mot'],
    category: 'texte',
    definition:
      'La phrase s’affiche un mot à la fois, avec un délai régulier. Le spectateur lit au rythme imposé par l’animation.',
    whenToUse: 'Pour une phrase clé de 3 à 6 mots qui doit être lue dans l’ordre, au tempo de la musique.',
    mistake: 'Des mots longs ou une phrase de 12 mots : le rythme s’étire et l’attention chute.',
    promptWord: 'word-by-word (un mot toutes les 0,1 s, chaque mot 0,45 s expo out, translateY 12 px → 0)',
    params: { duration: 0.45, easingName: 'expo out', easingCss: EASE.expoOut, delay: 0.1, extra: [['Décalage par mot', '0,1 s']] },
    demo: (ctx) => {
      const k = kit(ctx);
      const L = layer(k.stage, 'gap:2cqw;flex-wrap:wrap;padding:0 8cqw;');
      'On crée des sites qui convertissent.'.split(' ').forEach((w, i) => {
        const e = el(L, `display:inline-block;${textStyle(7)}`, w);
        k.a(e, [{ opacity: 0, transform: 'translateY(3cqw)' }, { opacity: 1, transform: 'translateY(0)' }], {
          duration: k.p.duration,
          easing: k.p.easingCss,
          delay: 0.25 + i * k.p.delay
        });
      });
      return k.done();
    }
  },
  {
    id: 'char-stagger',
    name: 'Letter-by-letter',
    aliases: ['letter-by-letter', 'letter by letter', 'char stagger', 'lettre par lettre'],
    category: 'texte',
    definition:
      'Chaque lettre apparaît séparément avec un micro-décalage. Le mot semble se “construire” sous les yeux.',
    whenToUse: 'Pour un mot unique et court : un nom de marque, un chiffre, un mot-clé.',
    mistake: 'L’appliquer à une phrase entière : c’est lent et fatigant à lire.',
    promptWord: 'letter-by-letter (stagger 0,03 s par lettre, chute de 30 % de la hauteur, 0,5 s expo out)',
    params: { duration: 0.5, easingName: 'expo out', easingCss: EASE.expoOut, delay: 0.03, extra: [['Décalage par lettre', '0,03 s']] },
    demo: (ctx) => {
      const k = kit(ctx);
      const L = layer(k.stage);
      Array.from('PROPULSÉ').forEach((ch, i) => {
        const e = el(L, `display:inline-block;${textStyle(11)}`, ch);
        k.a(e, [{ opacity: 0, transform: 'translateY(-6cqw) rotate(-8deg)' }, { opacity: 1, transform: 'translateY(0) rotate(0)' }], {
          duration: k.p.duration,
          easing: k.p.easingCss,
          delay: 0.25 + i * k.p.delay
        });
      });
      return k.done();
    }
  },
  {
    id: 'tracking-in',
    name: 'Tracking in',
    aliases: ['tracking in', 'tracking', 'letter-spacing'],
    category: 'texte',
    definition:
      'L’espacement entre les lettres (tracking) se resserre pendant que le texte apparaît. Le mot semble se condenser et se “verrouiller”.',
    whenToUse: 'Pour une signature finale, un nom de produit ou un slogan court.',
    mistake: 'Partir d’un tracking énorme : le texte déborde du cadre au début de l’animation.',
    promptWord: 'tracking in (letter-spacing 0.5em → -0.035em, opacité 0 → 1, 0,9 s expo out)',
    params: { duration: 0.9, easingName: 'expo out', easingCss: EASE.expoOut, delay: 0.2, extra: [['Tracking', '0.5em → -0.035em']] },
    demo: (ctx) => {
      const k = kit(ctx);
      const L = layer(k.stage);
      const t = el(L, textStyle(9), 'MOTION');
      k.a(t, [{ letterSpacing: '0.5em', opacity: 0 }, { letterSpacing: '-0.035em', opacity: 1 }], {
        duration: k.p.duration,
        easing: k.p.easingCss,
        delay: k.p.delay
      });
      return k.done();
    }
  },

  // ───────────── Transitions ─────────────
  {
    id: 'wipe',
    name: 'Wipe',
    aliases: ['wipe', 'balayage'],
    category: 'transitions',
    definition:
      'La scène suivante remplace la précédente en la “balayant” selon une ligne qui traverse l’écran. On voit le bord net qui avance.',
    whenToUse: 'Pour passer d’une idée à une autre avec énergie, souvent en vertical sur mobile.',
    mistake: 'Un wipe lent et linéaire : il paraît daté (effet PowerPoint).',
    promptWord: 'wipe vertical de bas en haut (clip-path, 0,6 s expo in-out)',
    params: { duration: 0.6, easingName: 'expo in-out', easingCss: EASE.expoInOut, delay: 0.6 },
    demo: (ctx) => {
      const k = kit(ctx);
      panel(k.stage, SURFACE, 'Scène A');
      const b = panel(k.stage, INK, 'Scène B', BG);
      k.a(b, [{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)' }], {
        duration: k.p.duration,
        easing: k.p.easingCss,
        delay: k.p.delay
      });
      return k.done();
    }
  },
  {
    id: 'match-cut',
    name: 'Match cut',
    aliases: ['match cut', 'raccord'],
    category: 'transitions',
    definition:
      'Une coupe franche entre deux scènes où une forme identique reste à la même place : un cercle devient un bouton, une ligne devient un graphique. L’œil fait le lien tout seul.',
    whenToUse: 'Pour relier deux idées (problème → solution) sans transition visible.',
    mistake: 'Formes de tailles ou positions différentes : le raccord ne fonctionne pas et ressemble à un bug.',
    promptWord: 'match cut sur le cercle (même position et diamètre, cut sec à 1,0 s)',
    params: { duration: 0.01, easingName: 'cut (step-end)', easingCss: 'step-end', delay: 1.0, extra: [['Forme partagée', 'cercle 18 % de largeur']] },
    demo: (ctx) => {
      const k = kit(ctx);
      const a = el(k.stage, `position:absolute;inset:0;background:${SURFACE};`);
      el(a, `position:absolute;left:50%;top:50%;width:18cqw;height:18cqw;margin:-9cqw;border-radius:50%;background:#ffb43d;box-shadow:0 0 6cqw #ffb43d;`);
      el(a, `position:absolute;left:0;right:0;top:66%;height:20cqw;background:linear-gradient(#3d7bff33,#3d7bff11);`);
      el(a, `position:absolute;left:6%;top:6%;${textStyle(3.4, 600, MUTED)}`, 'Scène A · coucher de soleil');
      const b = el(k.stage, `position:absolute;inset:0;background:${INK};`);
      el(b, `position:absolute;left:50%;top:50%;width:18cqw;height:18cqw;margin:-9cqw;border-radius:50%;background:${GRADIENT};display:flex;align-items:center;justify-content:center;${textStyle(4, 700, '#fff')}`, 'GO');
      el(b, `position:absolute;left:6%;top:6%;${textStyle(3.4, 600, '#8a8c99')}`, 'Scène B · bouton');
      k.a(b, [{ opacity: 0 }, { opacity: 1 }], { duration: k.p.duration, easing: 'step-end', delay: k.p.delay });
      const circle = a.firstElementChild as HTMLElement;
      k.a(circle, [{ transform: 'scale(.9)' }, { transform: 'scale(1)' }], { duration: k.p.delay, easing: EASE.out });
      return k.done();
    }
  },
  {
    id: 'whip-pan',
    name: 'Whip pan',
    aliases: ['whip pan', 'filé', 'swish pan'],
    category: 'transitions',
    definition:
      'Un mouvement de caméra latéral ultra-rapide avec un fort flou de mouvement, qui “jette” le spectateur dans la scène suivante.',
    whenToUse: 'Pour un enchaînement énergique entre deux plans, dans un rythme rapide.',
    mistake: 'Oublier le flou directionnel : sans lui, on voit juste un glissement brusque.',
    promptWord: 'whip pan horizontal (0,45 s expo in-out, flou directionnel jusqu’à 24 px au milieu)',
    params: { duration: 0.45, easingName: 'expo in-out', easingCss: EASE.expoInOut, delay: 0.7, extra: [['Flou max', '24 px']] },
    demo: (ctx) => {
      const k = kit(ctx);
      const strip = el(k.stage, 'position:absolute;top:0;left:0;height:100%;width:200%;display:flex;');
      const a = el(strip, `position:relative;flex:1;background:${SURFACE};`);
      panel(a, SURFACE, 'Avant');
      const b = el(strip, `position:relative;flex:1;`);
      panel(b, GRADIENT, 'Après', '#fff');
      k.a(strip, [{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], { duration: k.p.duration, easing: k.p.easingCss, delay: k.p.delay });
      k.a(strip, [{ filter: 'blur(0px)' }, { filter: 'blur(24px)', offset: 0.5 }, { filter: 'blur(0px)' }], {
        duration: k.p.duration,
        delay: k.p.delay,
        easing: EASE.inOut
      });
      return k.done();
    }
  },
  {
    id: 'morph',
    name: 'Morph',
    aliases: ['morph', 'morphing', 'shape morph'],
    category: 'transitions',
    definition:
      'Une forme se transforme progressivement en une autre (taille, arrondis, contenu) au lieu d’être remplacée. Le regard suit un seul objet qui change.',
    whenToUse: 'Pour faire d’une pilule une carte (maquette de site), d’un bouton une fenêtre, d’un point un graphique.',
    mistake: 'Changer le contenu pendant la déformation : le texte s’écrase. Il faut faire disparaître le contenu avant, puis révéler le nouveau.',
    promptWord: 'morph pilule → carte (largeur, hauteur et border-radius animés, 0,8 s expo out)',
    params: { duration: 0.8, easingName: 'expo out', easingCss: EASE.expoOut, delay: 0.6, extra: [['Rayon', '999 px → 24 px']] },
    demo: (ctx) => {
      const k = kit(ctx);
      const L = layer(k.stage);
      const shape = el(L, `position:relative;width:36cqw;height:10cqw;border-radius:99cqw;background:${SURFACE};box-shadow:0 2cqw 6cqw -2cqw rgba(13,13,20,.3);overflow:hidden;`);
      const t1 = el(shape, `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;${textStyle(4.2)}`, 'Voir le site');
      const t2 = el(shape, 'position:absolute;inset:0;padding:3cqw;display:flex;flex-direction:column;gap:1.6cqw;');
      el(t2, `width:40%;height:3cqw;border-radius:1cqw;background:${INK};`);
      el(t2, `width:70%;height:1.6cqw;border-radius:1cqw;background:${MUTED};opacity:.5;`);
      el(t2, `flex:1;border-radius:1.6cqw;background:${GRADIENT};opacity:.85;`);
      const d = k.p.delay;
      k.a(t1, [{ opacity: 1 }, { opacity: 0 }], { duration: 0.15, delay: d - 0.15, fill: 'forwards' });
      k.a(shape, [{ width: '36cqw', height: '10cqw', borderRadius: '99cqw' }, { width: '56cqw', height: '38cqw', borderRadius: '3cqw' }], {
        duration: k.p.duration,
        easing: k.p.easingCss,
        delay: d
      });
      k.a(t2, [{ opacity: 0, transform: 'translateY(2cqw)' }, { opacity: 1, transform: 'translateY(0)' }], {
        duration: 0.4,
        easing: EASE.expoOut,
        delay: d + k.p.duration * 0.5
      });
      return k.done();
    }
  },
  {
    id: 'smear',
    name: 'Smear frame',
    aliases: ['smear', 'smear frame', 'traînée'],
    category: 'transitions',
    definition:
      'Pendant un mouvement très rapide, l’objet est volontairement étiré sur une ou deux images pour suggérer la vitesse. Technique issue du dessin animé.',
    whenToUse: 'Pour un déplacement éclair (un élément qui fonce d’un côté à l’autre) sans flou de mouvement coûteux.',
    mistake: 'Garder l’étirement trop longtemps : l’œil voit une forme déformée au lieu d’une vitesse.',
    promptWord: 'smear frame (scaleX 3 sur 2 images au pic de vitesse, déplacement 0,35 s)',
    params: { duration: 0.35, easingName: 'expo in-out', easingCss: EASE.expoInOut, delay: 0.5, extra: [['Étirement', 'scaleX × 3']] },
    demo: (ctx) => {
      const k = kit(ctx);
      label(k.stage, 'Étirement au pic de vitesse');
      const L = layer(k.stage);
      const b = el(L, `width:9cqw;height:9cqw;border-radius:99cqw;background:${GRADIENT};`);
      const d = k.p.duration;
      const kf: Keyframe[] = [
        { transform: 'translateX(-32cqw) scaleX(1)', offset: 0 },
        { transform: 'translateX(-24cqw) scaleX(1.2)', offset: 0.3 },
        { transform: 'translateX(0) scaleX(3)', offset: 0.5 },
        { transform: 'translateX(24cqw) scaleX(1.2)', offset: 0.7 },
        { transform: 'translateX(32cqw) scaleX(1)', offset: 1 }
      ];
      k.a(b, kf, { duration: d, delay: k.p.delay, easing: 'linear' });
      k.a(b, [...kf].reverse().map((f, i) => ({ ...f, offset: i / 4 })), { duration: d, delay: k.p.delay + d + 0.6, fill: 'forwards' });
      return k.done();
    }
  },
  {
    id: 'crossfade',
    name: 'Crossfade',
    aliases: ['crossfade', 'cross-fade', 'dissolve', 'fondu enchaîné'],
    category: 'transitions',
    definition:
      'L’image A disparaît en fondu pendant que l’image B apparaît en fondu, les deux se superposant un instant. C’est la transition la plus douce.',
    whenToUse: 'Pour des moments calmes, émotionnels, ou entre deux visuels proches.',
    mistake: 'L’utiliser avec du texte sur du texte : pendant le fondu, deux phrases se superposent et deviennent illisibles.',
    promptWord: 'crossfade de 0,5 s (ease-in-out), jamais entre deux textes',
    params: { duration: 0.5, easingName: 'ease-in-out', easingCss: EASE.inOut, delay: 0.8 },
    demo: (ctx) => {
      const k = kit(ctx);
      const a = el(k.stage, `position:absolute;inset:0;background:radial-gradient(circle at 30% 40%, #3d7bff55, transparent 60%), ${SURFACE};`);
      el(a, `position:absolute;left:50%;top:50%;width:26cqw;height:26cqw;margin:-13cqw;border-radius:4cqw;background:#3d7bff;opacity:.85;`);
      const b = el(k.stage, `position:absolute;inset:0;background:radial-gradient(circle at 70% 60%, #ff8a3d55, transparent 60%), ${SURFACE};`);
      el(b, `position:absolute;left:50%;top:50%;width:26cqw;height:26cqw;margin:-13cqw;border-radius:50%;background:#ff8a3d;opacity:.85;`);
      k.a(a, [{ opacity: 1 }, { opacity: 0 }], { duration: k.p.duration, easing: k.p.easingCss, delay: k.p.delay });
      k.a(b, [{ opacity: 0 }, { opacity: 1 }], { duration: k.p.duration, easing: k.p.easingCss, delay: k.p.delay });
      return k.done();
    }
  },
  {
    id: 'zoom-through',
    name: 'Zoom through',
    aliases: ['zoom through', 'zoom transition', 'zoom-in transition'],
    category: 'transitions',
    definition:
      'La caméra plonge dans un élément de la scène (une lettre, un écran, un trou) jusqu’à ce qu’il remplisse le cadre et révèle la scène suivante.',
    whenToUse: 'Pour “entrer” dans un produit : zoomer dans l’écran d’une maquette pour montrer le site.',
    mistake: 'Zoomer sur un élément flou ou pixelisé : en vectoriel/DOM il faut un élément net à toutes les échelles.',
    promptWord: 'zoom through dans le “O” (scale 1 → 40, 0,9 s expo in)',
    params: { duration: 0.9, easingName: 'expo in', easingCss: EASE.expoIn, delay: 0.5, extra: [['Échelle', '1 → 40']] },
    demo: (ctx) => {
      const k = kit(ctx);
      const b = panel(k.stage, GRADIENT, 'Bienvenue', '#fff');
      const L = layer(k.stage, `background:${SURFACE};`);
      const word = el(L, `display:flex;align-items:center;${textStyle(16)}`);
      el(word, '', 'G');
      const o = el(word, `display:inline-block;width:11cqw;height:13cqw;margin:0 .4cqw;border-radius:50%;border:3.2cqw solid ${INK};`);
      el(word, '', '!');
      // Centre le zoom exactement sur le « O ».
      const lr = L.getBoundingClientRect();
      const or = o.getBoundingClientRect();
      if (lr.width > 0) L.style.transformOrigin = `${or.left + or.width / 2 - lr.left}px ${or.top + or.height / 2 - lr.top}px`;
      k.a(L, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(40)', opacity: 1, offset: 0.92 }, { transform: 'scale(48)', opacity: 0 }], {
        duration: k.p.duration,
        easing: k.p.easingCss,
        delay: k.p.delay
      });
      k.a(b, [{ transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 0.8, easing: EASE.expoOut, delay: k.p.delay + k.p.duration * 0.8 });
      return k.done();
    }
  }
];
