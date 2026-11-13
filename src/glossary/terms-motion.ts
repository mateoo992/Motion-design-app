import { EASE, GRADIENT, INK, MUTED, SURFACE, el, kit, label, layer, springSamples, textStyle } from './kit';
import type { Term } from './types';

const ball = (parent: HTMLElement, size = 9, css = '') =>
  el(parent, `width:${size}cqw;height:${size}cqw;border-radius:50%;background:${GRADIENT};${css}`);

const track = (parent: HTMLElement, top: string) =>
  el(parent, `position:absolute;left:10%;right:10%;top:${top};height:1px;background:${MUTED};opacity:.35;`);

export const MOTION_TERMS: Term[] = [
  // ───────────── Timing & easing ─────────────
  {
    id: 'ease-in',
    name: 'Ease-in',
    aliases: ['ease-in', 'ease in'],
    category: 'timing',
    definition:
      'Le mouvement démarre lentement puis accélère jusqu’à la fin. C’est la sensation d’un objet qui prend de l’élan et quitte le cadre.',
    whenToUse: 'Pour les sorties : un élément qui part hors champ, une scène qui s’efface avant une transition.',
    mistake: 'L’utiliser pour une entrée : l’élément arrive à pleine vitesse et “cogne” sa position finale.',
    promptWord: 'ease-in (cubic-bezier(0.42, 0, 1, 1)) pour la sortie',
    params: { duration: 0.9, easingName: 'ease-in', easingCss: EASE.in, delay: 0.2 },
    demo: (ctx) => {
      const k = kit(ctx);
      label(k.stage, 'Sortie accélérée');
      const L = layer(k.stage);
      const card = el(L, `width:34cqw;height:20cqw;border-radius:3cqw;background:${SURFACE};box-shadow:0 2cqw 5cqw -2cqw rgba(13,13,20,.25);display:flex;align-items:center;justify-content:center;${textStyle(4.6)}`, 'Au revoir');
      k.a(card, [{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(85cqw)', opacity: 1 }], {
        duration: k.p.duration,
        easing: k.p.easingCss,
        delay: k.p.delay
      });
      k.curve(k.p.easingCss, k.p.duration, k.p.delay);
      return k.done();
    }
  },
  {
    id: 'ease-out',
    name: 'Ease-out',
    aliases: ['ease-out', 'ease out'],
    category: 'timing',
    definition:
      'Le mouvement part vite puis ralentit doucement jusqu’à l’arrêt. L’œil perçoit un objet qui “se pose” naturellement.',
    whenToUse: 'Pour toutes les entrées : texte, cartes, boutons qui arrivent à l’écran.',
    mistake: 'Une durée trop longue (> 1 s) : l’élément semble “flotter” et le rythme s’effondre.',
    promptWord: 'ease-out (cubic-bezier(0, 0, 0.58, 1)) pour l’entrée',
    params: { duration: 0.8, easingName: 'ease-out', easingCss: EASE.out, delay: 0.2 },
    demo: (ctx) => {
      const k = kit(ctx);
      label(k.stage, 'Entrée qui se pose');
      const L = layer(k.stage);
      const card = el(L, `width:34cqw;height:20cqw;border-radius:3cqw;background:${SURFACE};box-shadow:0 2cqw 5cqw -2cqw rgba(13,13,20,.25);display:flex;align-items:center;justify-content:center;${textStyle(4.6)}`, 'Bonjour');
      k.a(card, [{ transform: 'translateY(55cqw)' }, { transform: 'translateY(0)' }], {
        duration: k.p.duration,
        easing: k.p.easingCss,
        delay: k.p.delay
      });
      k.curve(k.p.easingCss, k.p.duration, k.p.delay);
      return k.done();
    }
  },
  {
    id: 'ease-in-out',
    name: 'Ease-in-out',
    aliases: ['ease-in-out', 'ease in out'],
    category: 'timing',
    definition:
      'Le mouvement accélère au départ et ralentit à l’arrivée. C’est la courbe la plus “neutre” pour un déplacement d’un point A à un point B.',
    whenToUse: 'Pour un objet qui se déplace à l’intérieur du cadre (A → B) ou un mouvement de caméra.',
    mistake: 'L’appliquer partout par défaut : tout finit par avoir le même rythme mou et générique.',
    promptWord: 'ease-in-out (cubic-bezier(0.42, 0, 0.58, 1)) pour le déplacement A → B',
    params: { duration: 1.1, easingName: 'ease-in-out', easingCss: EASE.inOut, delay: 0.15 },
    demo: (ctx) => {
      const k = kit(ctx);
      label(k.stage, 'A → B → A');
      track(k.stage, '50%');
      const L = layer(k.stage);
      el(k.stage, `position:absolute;left:14%;top:50%;transform:translate(-50%,-50%);${textStyle(3.6, 600, MUTED)}`, 'A');
      el(k.stage, `position:absolute;right:14%;top:50%;transform:translate(50%,-50%);${textStyle(3.6, 600, MUTED)}`, 'B');
      const b = ball(L, 8);
      k.a(b, [{ transform: 'translateX(-30cqw)' }, { transform: 'translateX(30cqw)' }], {
        duration: k.p.duration,
        easing: k.p.easingCss,
        delay: k.p.delay,
        iterations: 2,
        direction: 'alternate'
      });
      k.curve(k.p.easingCss, k.p.duration, k.p.delay);
      return k.done();
    }
  },
  {
    id: 'expo-out',
    name: 'Expo out',
    aliases: ['expo out', 'expo-out', 'easeOutExpo', 'exponential out'],
    category: 'timing',
    definition:
      'Une version extrême de l’ease-out : 80 % du trajet est parcouru presque instantanément, puis une très longue décélération. Le rendu est nerveux mais élégant.',
    whenToUse: 'Pour le look “premium tech” : apparitions de titres, cartes, chiffres. C’est l’easing signature des pubs SaaS.',
    mistake: 'Le combiner à une durée trop courte (< 0,3 s) : on ne voit plus la décélération, ça ressemble à un cut.',
    promptWord: 'expo out (cubic-bezier(0.16, 1, 0.3, 1))',
    params: { duration: 1.0, easingName: 'expo out', easingCss: EASE.expoOut, delay: 0.2 },
    demo: (ctx) => {
      const k = kit(ctx);
      label(k.stage, 'Arrivée nerveuse, fin très douce');
      const L = layer(k.stage, 'flex-direction:column;gap:2cqw;');
      const t = el(L, textStyle(9), 'Premium.');
      const bar = el(L, `width:40cqw;height:1.2cqw;border-radius:1cqw;background:${GRADIENT};transform-origin:left;`);
      k.a(t, [{ transform: 'translateX(-40cqw)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }], {
        duration: k.p.duration,
        easing: k.p.easingCss,
        delay: k.p.delay
      });
      k.a(bar, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: k.p.duration, easing: k.p.easingCss, delay: k.p.delay + 0.1 });
      k.curve(k.p.easingCss, k.p.duration, k.p.delay);
      return k.done();
    }
  },
  {
    id: 'spring',
    name: 'Spring',
    aliases: ['spring', 'ressort'],
    category: 'timing',
    definition:
      'Un mouvement simulé comme un ressort : il dépasse sa cible, revient, oscille un peu puis se stabilise. On le règle avec raideur (stiffness) et amortissement (damping).',
    whenToUse: 'Pour donner de la vie à un élément interactif : pilule, bouton, icône, badge qui “pop”.',
    mistake: 'Un amortissement trop faible : l’élément tremble longtemps et paraît cheap.',
    promptWord: 'spring (stiffness 170, damping 11, mass 1)',
    params: {
      duration: 1.2,
      easingName: 'spring (stiffness 170, damping 11)',
      easingCss: 'linear (courbe ressort échantillonnée)',
      delay: 0.2,
      extra: [['Oscillations', '≈ 2 visibles']]
    },
    demo: (ctx) => {
      const k = kit(ctx);
      label(k.stage, 'Pop avec rebonds');
      const L = layer(k.stage);
      const s = springSamples(170, 11);
      const pill = el(L, `padding:2.6cqw 6cqw;border-radius:99cqw;background:${INK};${textStyle(5, 700, 'var(--demo-bg)')}`, 'Nouveau');
      k.a(pill, s.map((v) => ({ transform: `scale(${v})` })), { duration: k.p.duration, delay: k.p.delay });
      k.curve('', k.p.duration, k.p.delay, s);
      return k.done();
    }
  },
  {
    id: 'overshoot',
    name: 'Overshoot',
    aliases: ['overshoot', 'back out', 'ease-out-back'],
    category: 'timing',
    definition:
      'L’élément dépasse légèrement sa position finale une seule fois, puis revient se caler. C’est un rebond unique, plus contrôlé qu’un spring.',
    whenToUse: 'Pour une pilule qui s’élargit, un élément qui s’agrandit ou un logo qui s’installe avec énergie.',
    mistake: 'Un dépassement trop fort (> 15 %) : l’effet devient cartoon et casse le côté sobre.',
    promptWord: 'overshoot léger (back out, cubic-bezier(0.34, 1.56, 0.64, 1))',
    params: { duration: 0.7, easingName: 'back out', easingCss: EASE.backOut, delay: 0.3, extra: [['Dépassement', '≈ 10 %']] },
    demo: (ctx) => {
      const k = kit(ctx);
      label(k.stage, 'Un seul dépassement');
      const L = layer(k.stage);
      const pill = el(L, `height:14cqw;border-radius:99cqw;background:${SURFACE};box-shadow:0 0 0 .4cqw rgba(61,123,255,.35);display:flex;align-items:center;justify-content:center;overflow:hidden;${textStyle(4.6)}`, 'Réservez une démo');
      k.a(pill, [{ width: '14cqw', color: 'transparent' }, { width: '52cqw', color: 'var(--demo-ink)' }], {
        duration: k.p.duration,
        easing: k.p.easingCss,
        delay: k.p.delay
      });
      k.curve(k.p.easingCss, k.p.duration, k.p.delay);
      return k.done();
    }
  },
  {
    id: 'stagger',
    name: 'Stagger',
    aliases: ['stagger', 'décalage', 'staggered'],
    category: 'timing',
    definition:
      'Plusieurs éléments jouent la même animation, mais chacun démarre avec un petit décalage. Cela crée une vague lisible au lieu d’un bloc qui apparaît d’un coup.',
    whenToUse: 'Pour des barres de graphique, des mots, des icônes ou des cartes d’une même famille.',
    mistake: 'Un décalage trop long (> 0,2 s) sur beaucoup d’éléments : l’animation n’en finit plus.',
    promptWord: 'stagger de 0,08 s entre chaque élément',
    params: { duration: 0.7, easingName: 'expo out', easingCss: EASE.expoOut, delay: 0.08, extra: [['Éléments', '7']] },
    demo: (ctx) => {
      const k = kit(ctx);
      label(k.stage, 'Décalage 0,08 s');
      const L = layer(k.stage, 'align-items:flex-end;gap:2.4cqw;padding-bottom:16cqw;');
      const heights = [18, 26, 22, 34, 30, 40, 46];
      heights.forEach((h, i) => {
        const b = el(L, `width:6cqw;height:${h}cqw;border-radius:1.4cqw 1.4cqw .4cqw .4cqw;background:${GRADIENT};transform-origin:bottom;`);
        k.a(b, [{ transform: 'scaleY(0)', opacity: 0 }, { transform: 'scaleY(1)', opacity: 1 }], {
          duration: k.p.duration,
          easing: k.p.easingCss,
          delay: 0.2 + i * k.p.delay
        });
      });
      return k.done();
    }
  },
  {
    id: 'hold',
    name: 'Hold',
    aliases: ['hold', 'temps de pause', 'tenue'],
    category: 'timing',
    definition:
      'Un moment où rien ne bouge volontairement, pour laisser le temps de lire ou de ressentir. Le hold fait partie du timing autant que le mouvement.',
    whenToUse: 'Après l’apparition d’un message clé ou d’un chiffre, avant la transition suivante.',
    mistake: 'Ne jamais laisser de hold : le spectateur n’a pas le temps de lire, tout défile.',
    promptWord: 'hold de 0,8 s après l’apparition complète',
    params: { duration: 0.5, easingName: 'expo out', easingCss: EASE.expoOut, delay: 0.8, extra: [['Hold', '0,8 s']] },
    demo: (ctx) => {
      const k = kit(ctx);
      const { duration: d, delay: hold } = k.p;
      label(k.stage, 'Entrée · hold · sortie');
      const L = layer(k.stage);
      const t = el(L, textStyle(8), '+38 % de leads');
      k.a(
        t,
        [
          { opacity: 0, transform: 'translateY(6cqw)', offset: 0 },
          { opacity: 1, transform: 'translateY(0)', offset: d / (d * 2 + hold) },
          { opacity: 1, transform: 'translateY(0)', offset: (d + hold) / (d * 2 + hold) },
          { opacity: 0, transform: 'translateY(-6cqw)', offset: 1 }
        ],
        { duration: d * 2 + hold, easing: 'linear', delay: 0.2 }
      );
      const bar = el(k.stage, `position:absolute;left:20%;right:20%;bottom:12%;height:1cqw;border-radius:1cqw;background:${MUTED};opacity:.25;`);
      const fill = el(bar, `position:absolute;inset:0;border-radius:1cqw;background:${GRADIENT};transform-origin:left;`);
      el(k.stage, `position:absolute;left:50%;bottom:4%;transform:translateX(-50%);${textStyle(3, 600, MUTED)}`, 'hold');
      k.a(fill, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: hold, delay: 0.2 + d });
      return k.done();
    }
  },

  // ───────────── Principes d'animation ─────────────
  {
    id: 'anticipation',
    name: 'Anticipation',
    aliases: ['anticipation'],
    category: 'principes',
    definition:
      'Un petit mouvement inverse juste avant l’action principale, comme un sauteur qui fléchit les genoux. Il prépare l’œil à ce qui va se passer.',
    whenToUse: 'Avant un départ rapide, un saut, une sortie franche ou un “pop” important.',
    mistake: 'Une anticipation trop longue ou trop ample : l’action principale perd tout son impact.',
    promptWord: 'anticipation : recul de 8 % pendant 0,15 s avant le départ',
    params: { duration: 0.9, easingName: 'ease-in puis expo out', easingCss: EASE.expoOut, delay: 0.15, extra: [['Recul', '−8 %']] },
    demo: (ctx) => {
      const k = kit(ctx);
      label(k.stage, 'Recul puis élan');
      track(k.stage, '62%');
      const L = layer(k.stage);
      const b = ball(L, 10);
      k.a(
        b,
        [
          { transform: 'translateX(-28cqw) scale(1,1)', easing: EASE.inOut },
          { transform: 'translateX(-33cqw) scale(.86,1.12)', offset: 0.25, easing: EASE.expoOut },
          { transform: 'translateX(30cqw) scale(1,1)' }
        ],
        { duration: k.p.duration, delay: 0.3 }
      );
      return k.done();
    }
  },
  {
    id: 'squash-stretch',
    name: 'Squash & stretch',
    aliases: ['squash & stretch', 'squash and stretch', 'squash', 'stretch'],
    category: 'principes',
    definition:
      'L’objet s’écrase à l’impact (squash) et s’étire dans la vitesse (stretch), en gardant le même volume. Cela donne du poids et de la souplesse.',
    whenToUse: 'Pour une pilule, une bulle ou une forme qui rebondit ou réagit à un choc.',
    mistake: 'Changer le volume (s’écraser sans s’élargir) : l’objet semble rétrécir au lieu de se déformer.',
    promptWord: 'squash & stretch (scale 1.25 × 0.8 à l’impact, volume conservé)',
    params: { duration: 1.2, easingName: 'ease-in (chute) / ease-out (rebond)', easingCss: `${EASE.in} / ${EASE.out}`, delay: 0, extra: [['Rebonds', '2']] },
    demo: (ctx) => {
      const k = kit(ctx);
      label(k.stage, 'Écrasé à l’impact');
      el(k.stage, `position:absolute;left:25%;right:25%;top:80%;height:.4cqw;background:${MUTED};opacity:.4;border-radius:1cqw;`);
      const b = el(k.stage, `position:absolute;left:50%;top:80%;width:11cqw;height:11cqw;margin-left:-5.5cqw;margin-top:-11cqw;border-radius:50%;background:${GRADIENT};transform-origin:50% 100%;`);
      k.a(
        b,
        [
          { transform: 'translateY(-36cqw) scale(.9,1.12)', easing: EASE.in },
          { transform: 'translateY(0) scale(.9,1.15)', offset: 0.3 },
          { transform: 'translateY(0) scale(1.28,.75)', offset: 0.36, easing: EASE.out },
          { transform: 'translateY(-16cqw) scale(.95,1.06)', offset: 0.6, easing: EASE.in },
          { transform: 'translateY(0) scale(1.15,.86)', offset: 0.82, easing: EASE.out },
          { transform: 'translateY(0) scale(1,1)' }
        ],
        { duration: k.p.duration, delay: 0.2 }
      );
      return k.done();
    }
  },
  {
    id: 'follow-through',
    name: 'Follow-through',
    aliases: ['follow-through', 'follow through'],
    category: 'principes',
    definition:
      'Quand l’objet principal s’arrête, ses parties souples (un badge, une ombre, un détail) continuent un peu puis se stabilisent. Rien ne s’arrête net dans la réalité.',
    whenToUse: 'Pour une carte qui s’arrête avec un badge, une étiquette ou un reflet attaché.',
    mistake: 'Tout s’arrête en même temps au pixel près : le mouvement paraît robotique.',
    promptWord: 'follow-through : le badge continue 6 % puis revient en spring',
    params: { duration: 0.8, easingName: 'expo out + spring', easingCss: EASE.expoOut, delay: 0.08, extra: [['Retard du badge', '0,08 s']] },
    demo: (ctx) => {
      const k = kit(ctx);
      label(k.stage, 'Le badge continue après l’arrêt');
      const L = layer(k.stage);
      const card = el(L, `position:relative;width:36cqw;height:22cqw;border-radius:3cqw;background:${SURFACE};box-shadow:0 2cqw 5cqw -2cqw rgba(13,13,20,.25);`);
      el(card, `position:absolute;left:3cqw;top:4cqw;width:18cqw;height:2cqw;border-radius:1cqw;background:${INK};opacity:.8;`);
      el(card, `position:absolute;left:3cqw;top:8cqw;width:26cqw;height:1.6cqw;border-radius:1cqw;background:${MUTED};opacity:.4;`);
      const badge = el(card, `position:absolute;right:-3cqw;top:-3cqw;padding:1.2cqw 2.4cqw;border-radius:99cqw;background:${GRADIENT};${textStyle(3, 700, '#fff')}`, 'NEW');
      k.a(card, [{ transform: 'translateX(-45cqw)' }, { transform: 'translateX(0)' }], { duration: k.p.duration, easing: k.p.easingCss, delay: 0.2 });
      const s = springSamples(120, 7);
      k.a(
        badge,
        [{ transform: 'translateX(-6cqw) rotate(-12deg)' }, ...s.map((v) => ({ transform: `translateX(${(1 - v) * -6}cqw) rotate(${(1 - v) * -12}deg)` }))],
        { duration: 1.1, delay: 0.2 + k.p.duration * 0.55 + k.p.delay }
      );
      return k.done();
    }
  },
  {
    id: 'overlapping-action',
    name: 'Overlapping action',
    aliases: ['overlapping action', 'overlap'],
    category: 'principes',
    definition:
      'Les différentes parties d’un ensemble ne bougent pas exactement en même temps : la tête mène, le reste suit avec un léger retard et une durée différente.',
    whenToUse: 'Pour une maquette de site (titre, texte, bouton) qui entre en bloc, ou un groupe d’éléments liés.',
    mistake: 'Confondre avec un stagger mécanique : ici les durées diffèrent aussi, ce n’est pas juste un délai constant.',
    promptWord: 'overlapping action : titre 0,6 s, texte 0,75 s (+0,05 s), bouton 0,9 s (+0,1 s)',
    params: { duration: 0.6, easingName: 'expo out', easingCss: EASE.expoOut, delay: 0.05, extra: [['Durées', '0,6 / 0,75 / 0,9 s']] },
    demo: (ctx) => {
      const k = kit(ctx);
      label(k.stage, 'Parties qui se chevauchent');
      const L = layer(k.stage, 'flex-direction:column;align-items:flex-start;gap:2cqw;padding-left:28cqw;justify-content:center;');
      const a1 = el(L, `width:38cqw;height:4.6cqw;border-radius:1cqw;background:${INK};`);
      const a2 = el(L, `width:30cqw;height:2.4cqw;border-radius:1cqw;background:${MUTED};opacity:.6;`);
      const a3 = el(L, `width:16cqw;height:6cqw;border-radius:99cqw;background:${GRADIENT};`);
      [a1, a2, a3].forEach((e, i) => {
        k.a(e, [{ transform: 'translateX(-60cqw)' }, { transform: 'translateX(0)' }], {
          duration: k.p.duration + i * 0.15,
          easing: k.p.easingCss,
          delay: 0.2 + i * k.p.delay
        });
      });
      return k.done();
    }
  },
  {
    id: 'arc',
    name: 'Arcs',
    aliases: ['arc', 'arcs', 'trajectoire en arc'],
    category: 'principes',
    definition:
      'Dans la nature, presque tout se déplace en courbe et non en ligne droite. Faire suivre un arc à un élément rend son déplacement organique.',
    whenToUse: 'Pour un élément qui “saute” d’une position à une autre, une icône qui vient se ranger.',
    mistake: 'Déplacer x et y avec le même easing : on obtient une ligne droite raide au lieu d’une courbe.',
    promptWord: 'trajectoire en arc (x en ease-in-out, y en ease-out puis ease-in)',
    params: { duration: 1.1, easingName: 'x : ease-in-out · y : out/in', easingCss: EASE.inOut, delay: 0.06, extra: [['Traînée', '5 fantômes']] },
    demo: (ctx) => {
      const k = kit(ctx);
      label(k.stage, 'Trajectoire courbe');
      const make = (opacity: number, delay: number) => {
        const x = el(k.stage, 'position:absolute;left:18%;top:72%;');
        const y = el(x, '');
        el(y, `width:7cqw;height:7cqw;margin:-3.5cqw;border-radius:50%;background:${GRADIENT};opacity:${opacity};`);
        k.a(x, [{ transform: 'translateX(0)' }, { transform: 'translateX(64cqw)' }], { duration: k.p.duration, easing: k.p.easingCss, delay: 0.2 + delay });
        k.a(
          y,
          [
            { transform: 'translateY(0)', easing: EASE.out },
            { transform: 'translateY(-34cqw)', offset: 0.5, easing: EASE.in },
            { transform: 'translateY(0)' }
          ],
          { duration: k.p.duration, delay: 0.2 + delay }
        );
      };
      [0.12, 0.18, 0.25, 0.35, 0.5].forEach((o, i) => make(o, (5 - i) * k.p.delay));
      make(1, 0);
      return k.done();
    }
  }
];
