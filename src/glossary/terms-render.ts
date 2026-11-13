import { BG, EASE, FONT, GRADIENT, INK, MUTED, SURFACE, el, kit, label, layer, springSamples, textStyle } from './kit';
import type { DemoCtx, DemoRun } from './kit';
import type { Term } from './types';

const blob = (parent: HTMLElement, color: string, size: number, x: string, y: string, blur = 0) =>
  el(
    parent,
    `position:absolute;left:${x};top:${y};width:${size}cqw;height:${size}cqw;margin:-${size / 2}cqw;border-radius:50%;background:${color};${blur ? `filter:blur(${blur}cqw);` : ''}`
  );

/** Démo commune aux formats : un cadre qui prend le ratio cible avec son contenu. */
function formatDemo(ratio: [number, number], dims: string, context: string) {
  return (ctx: DemoCtx): DemoRun => {
    const k = kit(ctx);
    const [rw, rh] = ratio;
    const maxH = 44;
    const maxW = 76;
    let h = maxH;
    let w = (h * rw) / rh;
    if (w > maxW) {
      w = maxW;
      h = (w * rh) / rw;
    }
    // Les hauteurs sont exprimées en cqw : le stage fait 62,5 cqw de haut (ratio 16:10).
    const L = layer(k.stage);
    const frame = el(
      L,
      `position:relative;width:${w}cqw;height:${h}cqw;border-radius:1.6cqw;background:${SURFACE};box-shadow:0 0 0 .3cqw ${INK}, 0 3cqw 6cqw -3cqw rgba(13,13,20,.35);overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.4cqw;`
    );
    el(frame, `position:absolute;inset:0;background:radial-gradient(circle at 50% 120%, #ff3d9a33, transparent 60%);`);
    const title = el(frame, `position:relative;${textStyle(Math.min(w, h) / 6)}`, 'Votre pub');
    const cta = el(frame, `position:relative;padding:.8cqw 2.4cqw;border-radius:99cqw;background:${GRADIENT};${textStyle(Math.min(w, h) / 12, 700, '#fff')}`, 'Découvrir');
    el(k.stage, `position:absolute;left:4%;top:5%;${textStyle(4.4)}`, `${rw}:${rh}`);
    el(k.stage, `position:absolute;left:4%;top:13%;${textStyle(2.8, 600, MUTED)}`, dims);
    el(k.stage, `position:absolute;right:4%;bottom:6%;${textStyle(2.8, 600, MUTED)}`, context);
    k.a(frame, [{ width: '30cqw', height: '30cqw', opacity: 0 }, { width: `${w}cqw`, height: `${h}cqw`, opacity: 1 }], {
      duration: k.p.duration,
      easing: k.p.easingCss,
      delay: k.p.delay
    });
    k.a(title, [{ opacity: 0, transform: 'translateY(2cqw)' }, { opacity: 1, transform: 'translateY(0)' }], {
      duration: 0.5,
      easing: EASE.expoOut,
      delay: k.p.delay + k.p.duration * 0.6
    });
    k.a(cta, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], {
      duration: 0.5,
      easing: EASE.backOut,
      delay: k.p.delay + k.p.duration * 0.6 + 0.12
    });
    return k.done();
  };
}

export const RENDER_TERMS: Term[] = [
  // ───────────── Rendu & style ─────────────
  {
    id: 'glassmorphism',
    name: 'Glassmorphism',
    aliases: ['glassmorphism', 'glassmorphisme', 'frosted glass', 'verre dépoli'],
    category: 'rendu',
    definition:
      'Une surface semi-transparente qui floute ce qui passe derrière elle, comme du verre dépoli, avec un fin liseré clair. Elle donne de la profondeur sans alourdir.',
    whenToUse: 'Pour des cartes, pilules ou panneaux posés sur des formes colorées en mouvement.',
    mistake: 'Mettre du verre sur un fond uni : sans couleurs derrière, l’effet est invisible.',
    promptWord: 'glassmorphism (backdrop-filter: blur(24px), fond blanc 45 %, bordure 1 px blanc 60 %)',
    params: { duration: 3, easingName: 'ease-in-out', easingCss: EASE.inOut, delay: 0, extra: [['Flou d’arrière-plan', '24 px']] },
    demo: (ctx) => {
      const k = kit(ctx);
      const b1 = blob(k.stage, '#3d7bff', 24, '30%', '40%');
      const b2 = blob(k.stage, '#ff3d9a', 20, '70%', '60%');
      const b3 = blob(k.stage, '#ff8a3d', 14, '55%', '25%');
      const L = layer(k.stage);
      el(
        L,
        `width:46cqw;height:26cqw;border-radius:3cqw;background:rgba(255,255,255,.42);backdrop-filter:blur(3cqw);-webkit-backdrop-filter:blur(3cqw);border:1px solid rgba(255,255,255,.65);display:flex;align-items:center;justify-content:center;${textStyle(5)}`,
        'Verre dépoli'
      );
      const d = k.p.duration;
      k.a(b1, [{ transform: 'translate(0,0)' }, { transform: 'translate(30cqw,6cqw)' }], { duration: d, easing: k.p.easingCss, direction: 'alternate', iterations: 2 });
      k.a(b2, [{ transform: 'translate(0,0)' }, { transform: 'translate(-34cqw,-10cqw)' }], { duration: d, easing: k.p.easingCss, direction: 'alternate', iterations: 2 });
      k.a(b3, [{ transform: 'translate(0,0)' }, { transform: 'translate(-10cqw,22cqw)' }], { duration: d, easing: k.p.easingCss, direction: 'alternate', iterations: 2 });
      return k.done();
    }
  },
  {
    id: 'glow',
    name: 'Halo / glow',
    aliases: ['glow', 'halo', 'lueur'],
    category: 'rendu',
    definition:
      'Une lumière douce et colorée qui rayonne derrière un élément, obtenue avec une forme très floutée. Elle attire l’œil sans ajouter d’objet.',
    whenToUse: 'Derrière un chiffre clé, un logo ou un bouton pour le mettre en valeur sur fond clair ou sombre.',
    mistake: 'Un halo trop saturé et trop grand : il “bave” et salit tout le cadre.',
    promptWord: 'halo en dégradé flouté (blur 60 px, opacité 0,55, respiration scale 0.9 → 1.1 sur 1,6 s)',
    params: { duration: 1.6, easingName: 'ease-in-out', easingCss: EASE.inOut, delay: 0, extra: [['Flou', '60 px'], ['Opacité', '0,55']] },
    demo: (ctx) => {
      const k = kit(ctx);
      const L = layer(k.stage);
      const halo = el(L, `position:absolute;width:44cqw;height:24cqw;border-radius:50%;background:${GRADIENT};filter:blur(7cqw);opacity:.55;`);
      el(L, `position:relative;${textStyle(13)}`, '×3');
      k.a(halo, [{ transform: 'scale(.9)', opacity: 0.35 }, { transform: 'scale(1.1)', opacity: 0.6 }], {
        duration: k.p.duration,
        easing: k.p.easingCss,
        iterations: 2,
        direction: 'alternate'
      });
      return k.done();
    }
  },
  {
    id: 'grain',
    name: 'Grain',
    aliases: ['grain', 'film grain', 'noise'],
    category: 'rendu',
    definition:
      'Un bruit fin et animé posé sur l’image, comme la texture d’une pellicule. Il casse l’aspect trop lisse du numérique et évite les dégradés en escaliers (banding).',
    whenToUse: 'Sur des grands aplats ou dégradés, à très faible intensité, pour un rendu plus organique.',
    mistake: 'Un grain trop fort ou figé : on dirait une erreur de compression vidéo.',
    promptWord: 'grain animé (canvas, opacité 6 %, renouvelé toutes les 2 images)',
    params: { duration: 3, easingName: 'aucun (bruit aléatoire)', easingCss: 'n/a', delay: 0, extra: [['Opacité', '6 % (exagérée ici à 20 %)']] },
    demo: (ctx) => {
      const k = kit(ctx);
      el(k.stage, `position:absolute;inset:0;background:${GRADIENT};`);
      el(k.stage, `position:absolute;left:0;top:0;bottom:0;width:50%;border-right:1px dashed rgba(255,255,255,.7);`);
      el(k.stage, `position:absolute;left:4%;top:6%;${textStyle(3.2, 700, '#fff')}`, 'Sans grain');
      el(k.stage, `position:absolute;right:4%;top:6%;${textStyle(3.2, 700, '#fff')}`, 'Avec grain');
      const off = document.createElement('canvas');
      off.width = 120;
      off.height = 150;
      const og = off.getContext('2d');
      let frame = 0;
      k.canvas(
        k.p.duration,
        (_t, g, w, h) => {
          frame++;
          if (!og || frame % 2) return;
          const img = og.createImageData(off.width, off.height);
          for (let i = 0; i < img.data.length; i += 4) {
            const v = Math.random() * 255;
            img.data[i] = v;
            img.data[i + 1] = v;
            img.data[i + 2] = v;
            img.data[i + 3] = 52;
          }
          og.putImageData(img, 0, 0);
          g.clearRect(0, 0, w, h);
          g.imageSmoothingEnabled = false;
          g.drawImage(off, w / 2, 0, w / 2, h);
        },
        'mix-blend-mode:overlay;'
      );
      return k.done();
    }
  },
  {
    id: 'depth-of-field',
    name: 'Depth of field',
    aliases: ['depth of field', 'profondeur de champ', 'dof', 'rack focus'],
    category: 'rendu',
    definition:
      'Seul un plan de l’image est net ; ce qui est devant ou derrière est flou. Déplacer cette zone nette (rack focus) guide le regard d’un élément à l’autre.',
    whenToUse: 'Pour isoler le sujet principal ou faire passer l’attention d’un objet à un autre.',
    mistake: 'Tout flouter sauf un minuscule détail : le spectateur ne comprend plus la scène.',
    promptWord: 'depth of field : rack focus du premier plan (net) vers l’arrière-plan, blur 0 ↔ 8 px en 0,8 s',
    params: { duration: 0.8, easingName: 'ease-in-out', easingCss: EASE.inOut, delay: 0.8, extra: [['Flou hors champ', '8 px']] },
    demo: (ctx) => {
      const k = kit(ctx);
      label(k.stage, 'Mise au point : avant → arrière');
      const back = el(k.stage, `position:absolute;left:58%;top:22%;width:30cqw;height:20cqw;border-radius:2cqw;background:${GRADIENT};opacity:.8;`);
      const mid = el(k.stage, `position:absolute;left:38%;top:36%;width:22cqw;height:16cqw;border-radius:2cqw;background:${MUTED};opacity:.6;`);
      const front = el(k.stage, `position:absolute;left:10%;top:48%;width:30cqw;height:22cqw;border-radius:2cqw;background:${INK};display:flex;align-items:center;justify-content:center;${textStyle(4, 700, BG)}`, 'Sujet');
      const d = k.p.duration;
      const o = { duration: d, easing: k.p.easingCss, delay: k.p.delay };
      k.a(front, [{ filter: 'blur(0px)' }, { filter: 'blur(1.4cqw)' }], o);
      k.a(mid, [{ filter: 'blur(.6cqw)' }, { filter: 'blur(.6cqw)' }], o);
      k.a(back, [{ filter: 'blur(1.4cqw)' }, { filter: 'blur(0px)' }], o);
      return k.done();
    }
  },
  {
    id: 'motion-blur',
    name: 'Motion blur',
    aliases: ['motion blur', 'flou de mouvement', 'flou cinétique'],
    category: 'rendu',
    definition:
      'Un flou dans la direction du mouvement, proportionnel à la vitesse, comme sur une photo prise en pose longue. Il rend les mouvements rapides fluides au lieu de saccadés.',
    whenToUse: 'Pour tout déplacement rapide, surtout en 60 fps enregistré à l’écran.',
    mistake: 'Mettre du flou sur un objet lent ou immobile : il paraît juste flou, pas rapide.',
    promptWord: 'motion blur directionnel proportionnel à la vitesse (max 16 px horizontal)',
    params: { duration: 0.6, easingName: 'expo in-out', easingCss: EASE.expoInOut, delay: 0.3, extra: [['Fantômes', '4 copies à 15 %']] },
    demo: (ctx) => {
      const k = kit(ctx);
      el(k.stage, `position:absolute;left:4%;top:20%;${textStyle(3, 600, MUTED)}`, 'Sans');
      el(k.stage, `position:absolute;left:4%;top:64%;${textStyle(3, 600, MUTED)}`, 'Avec');
      const lane = (top: string, blurred: boolean) => {
        const go = (opacity: number, lag: number) => {
          const b = el(k.stage, `position:absolute;left:22%;top:${top};width:12cqw;height:8cqw;margin-top:-4cqw;border-radius:1.6cqw;background:${GRADIENT};opacity:${opacity};`);
          k.a(b, [{ transform: 'translateX(0)' }, { transform: 'translateX(52cqw)' }], {
            duration: k.p.duration,
            easing: k.p.easingCss,
            delay: k.p.delay + lag,
            iterations: 2,
            direction: 'alternate'
          });
          if (blurred)
            k.a(b, [{ filter: 'blur(0)' }, { filter: 'blur(1.4cqw)', offset: 0.5 }, { filter: 'blur(0)' }], {
              duration: k.p.duration,
              delay: k.p.delay + lag,
              iterations: 2
            });
        };
        if (blurred) [0.15, 0.15, 0.15, 0.15].forEach((o, i) => go(o, (i + 1) * 0.02));
        go(1, 0);
      };
      lane('30%', false);
      lane('74%', true);
      return k.done();
    }
  },
  {
    id: 'gradient-accent',
    name: 'Gradient accent',
    aliases: ['gradient accent', 'accent en dégradé', 'dégradé d’accent'],
    category: 'rendu',
    definition:
      'Une seule touche de couleur en dégradé, utilisée avec parcimonie (un mot, un trait, un bouton) dans une composition sinon monochrome. Elle signe la marque.',
    whenToUse: 'Pour souligner le mot-clé du message ou le CTA dans un style sobre.',
    mistake: 'Mettre le dégradé partout : il perd sa fonction de repère et l’image devient criarde.',
    promptWord: 'gradient accent unique à 100° (#3d7bff → #ff3d9a → #ff8a3d) sur le mot-clé uniquement',
    params: { duration: 0.7, easingName: 'expo out', easingCss: EASE.expoOut, delay: 0.4, extra: [['Angle', '100°']] },
    demo: (ctx) => {
      const k = kit(ctx);
      const L = layer(k.stage, 'flex-direction:column;gap:1cqw;');
      el(L, textStyle(7), 'Des sites qui');
      const wrap = el(L, 'position:relative;');
      const word = el(wrap, `${textStyle(9)};background:${GRADIENT};-webkit-background-clip:text;background-clip:text;`, 'convertissent');
      const line = el(wrap, `position:absolute;left:0;right:0;bottom:-1.4cqw;height:1cqw;border-radius:1cqw;background:${GRADIENT};transform-origin:left;`);
      k.a(word, [{ color: 'var(--demo-ink)' }, { color: 'transparent' }], { duration: k.p.duration, easing: k.p.easingCss, delay: k.p.delay });
      k.a(line, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: k.p.duration, easing: k.p.easingCss, delay: k.p.delay + 0.1 });
      return k.done();
    }
  },
  {
    id: 'fluted-glass',
    name: 'Fluted glass',
    aliases: ['fluted glass', 'verre cannelé', 'reeded glass', 'halo strié'],
    category: 'rendu',
    definition:
      'Un verre à cannelures verticales : la lumière derrière est découpée en bandes floues et légèrement décalées. Effet très tendance pour des halos premium.',
    whenToUse: 'Derrière un titre ou une maquette, ou comme transition (balayage du dégradé strié).',
    mistake: 'Des bandes trop larges ou trop contrastées : on voit des “rayures” au lieu d’un verre.',
    promptWord: 'fluted glass : halo en dégradé flouté masqué par 14 bandes verticales douces (backdrop-filter blur 10 px)',
    params: { duration: 2.4, easingName: 'ease-in-out', easingCss: EASE.inOut, delay: 0, extra: [['Bandes', '14'], ['Flou', '10 px']] },
    demo: (ctx) => {
      const k = kit(ctx);
      const glow = el(k.stage, `position:absolute;left:50%;top:50%;width:48cqw;height:30cqw;margin:-15cqw -24cqw;border-radius:50%;background:${GRADIENT};filter:blur(4cqw);`);
      const strips = el(k.stage, 'position:absolute;inset:0;display:flex;');
      for (let i = 0; i < 14; i++) {
        el(
          strips,
          'flex:1;backdrop-filter:blur(1.2cqw);-webkit-backdrop-filter:blur(1.2cqw);background:linear-gradient(90deg, rgba(255,255,255,.28), rgba(255,255,255,0) 40%, rgba(13,13,20,.06));'
        );
      }
      el(k.stage, `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;${textStyle(7)}`, 'Studio');
      k.a(glow, [{ transform: 'translateX(-18cqw) scale(.9)' }, { transform: 'translateX(18cqw) scale(1.1)' }], {
        duration: k.p.duration,
        easing: k.p.easingCss,
        direction: 'alternate',
        iterations: 2
      });
      return k.done();
    }
  },

  // ───────────── Structure ─────────────
  {
    id: 'scene',
    name: 'Scène',
    aliases: ['scene', 'scène'],
    category: 'structure',
    definition:
      'Un bloc de la vidéo qui porte une seule idée, avec son décor et ses éléments. Une pub de 15 s contient en général 4 à 6 scènes.',
    whenToUse: 'Pour découper ton message : accroche, problème, solution, preuve, CTA.',
    mistake: 'Mettre deux idées dans une même scène : le spectateur n’en retient aucune.',
    promptWord: 'Scène N [début s → fin s] : une seule idée',
    params: { duration: 1.0, easingName: 'expo out', easingCss: EASE.expoOut, delay: 0, extra: [['Scènes', '3 × 1 s']] },
    demo: (ctx) => {
      const k = kit(ctx);
      const names = ['Accroche', 'Preuve', 'CTA'];
      const colors = [SURFACE, '#3d7bff', INK];
      const fg = [INK, '#fff', BG];
      const d = k.p.duration;
      names.forEach((n, i) => {
        const s = el(k.stage, `position:absolute;inset:0 0 18% 0;background:${colors[i]};display:flex;align-items:center;justify-content:center;${textStyle(7, 700, fg[i])}`, n);
        k.a(s, [{ opacity: 0 }, { opacity: 1, offset: 0.001 }, { opacity: 1, offset: 0.999 }, { opacity: i === 2 ? 1 : 0 }], {
          duration: d,
          delay: i * d
        });
      });
      const tl = el(k.stage, 'position:absolute;left:6%;right:6%;bottom:5%;height:6%;display:flex;gap:1%;');
      names.forEach((n) => el(tl, `flex:1;border-radius:1cqw;background:${MUTED};opacity:.35;display:flex;align-items:center;justify-content:center;${textStyle(2.4, 600, INK)}`, n));
      const cursor = el(k.stage, `position:absolute;left:6%;bottom:3%;width:.5cqw;height:10%;background:${INK};`);
      k.a(cursor, [{ left: '6%' }, { left: '94%' }], { duration: d * 3 });
      return k.done();
    }
  },
  {
    id: 'shot',
    name: 'Plan (shot)',
    aliases: ['shot', 'plan large', 'plan serré', 'gros plan', 'close-up', 'wide shot'],
    category: 'structure',
    definition:
      'Le cadrage choisi pour montrer un élément : plan large (tout le contexte), plan serré (le sujet), gros plan (un détail). Changer de plan relance l’attention.',
    whenToUse: 'Pour montrer une maquette de site entière, puis zoomer sur le bouton clé.',
    mistake: 'Rester tout le temps en plan large : on ne voit jamais le détail qui compte.',
    promptWord: 'plan large → plan serré → gros plan (scale 1 → 1.8 → 3.2, 0,7 s expo in-out)',
    params: { duration: 0.7, easingName: 'expo in-out', easingCss: EASE.expoInOut, delay: 0.6, extra: [['Échelles', '1 / 1.8 / 3.2']] },
    demo: (ctx) => {
      const k = kit(ctx);
      const cam = el(k.stage, 'position:absolute;inset:0;transform-origin:68% 64%;');
      const site = el(cam, `position:absolute;left:18%;top:16%;width:64%;height:68%;border-radius:2cqw;background:${SURFACE};box-shadow:0 2cqw 5cqw -2cqw rgba(13,13,20,.3);`);
      el(site, `position:absolute;left:6%;top:12%;width:50%;height:12%;border-radius:1cqw;background:${INK};`);
      el(site, `position:absolute;left:6%;top:30%;width:70%;height:6%;border-radius:1cqw;background:${MUTED};opacity:.5;`);
      el(site, `position:absolute;left:6%;top:40%;width:60%;height:6%;border-radius:1cqw;background:${MUTED};opacity:.5;`);
      el(site, `position:absolute;left:62%;top:62%;width:26%;height:16%;border-radius:99cqw;background:${GRADIENT};`);
      const tag = el(k.stage, `position:absolute;left:4%;top:5%;padding:.8cqw 1.8cqw;border-radius:99cqw;background:${INK};${textStyle(2.8, 700, BG)}`, 'Plan large');
      const d = k.p.duration;
      const g = k.p.delay;
      k.a(cam, [{ transform: 'scale(1)' }, { transform: 'scale(1.8)' }], { duration: d, easing: k.p.easingCss, delay: g });
      k.a(cam, [{ transform: 'scale(1.8)' }, { transform: 'scale(3.2)' }], { duration: d, easing: k.p.easingCss, delay: g * 2 + d, fill: 'forwards' });
      const setLabel = (txt: string, at: number) => {
        const t = el(k.stage, `position:absolute;left:4%;top:5%;padding:.8cqw 1.8cqw;border-radius:99cqw;background:${INK};${textStyle(2.8, 700, BG)}`, txt);
        k.a(t, [{ opacity: 0 }, { opacity: 1 }], { duration: 0.01, delay: at });
      };
      void tag;
      setLabel('Plan serré', g + d);
      setLabel('Gros plan', g * 2 + d * 2);
      return k.done();
    }
  },
  {
    id: 'pacing',
    name: 'Rythme (pacing)',
    aliases: ['pacing', 'rythme', 'tempo'],
    category: 'structure',
    definition:
      'La vitesse à laquelle les plans et informations s’enchaînent. Un rythme rapide crée de l’énergie, un rythme lent crée de la gravité.',
    whenToUse: 'Pour adapter la pub au réseau : TikTok demande des coupes toutes les 1,5–3 s.',
    mistake: 'Un rythme constant du début à la fin : sans variation, l’attention décroche.',
    promptWord: 'rythme rapide : scènes de 2–3 s, coupe sur le temps fort, aucune scène > 3 s',
    params: { duration: 4, easingName: 'linear (curseur)', easingCss: EASE.linear, delay: 0, extra: [['Lent', '2 coupes'], ['Rapide', '7 coupes']] },
    demo: (ctx) => {
      const k = kit(ctx);
      const d = k.p.duration;
      const row = (top: string, name: string, cuts: number[]) => {
        el(k.stage, `position:absolute;left:4%;top:${top};margin-top:-6cqw;${textStyle(3, 600, MUTED)}`, name);
        const bar = el(k.stage, `position:absolute;left:4%;right:4%;top:${top};height:9cqw;display:flex;gap:.6cqw;`);
        const total = cuts.reduce((x, y) => x + y, 0);
        let acc = 0;
        cuts.forEach((c, i) => {
          const seg = el(bar, `flex:${c};border-radius:1cqw;background:${i % 2 ? INK : '#3d7bff'};opacity:.25;`);
          k.a(seg, [{ opacity: 0.25 }, { opacity: 1 }, { opacity: 0.5 }], { duration: Math.max(0.2, (c / total) * d), delay: (acc / total) * d });
          acc += c;
        });
      };
      row('32%', 'Lent', [5, 5]);
      row('72%', 'Rapide', [1.4, 1.1, 1.5, 1.3, 1.6, 1.2, 1.9]);
      const cur = el(k.stage, `position:absolute;left:4%;top:20%;bottom:8%;width:.5cqw;background:${INK};`);
      k.a(cur, [{ left: '4%' }, { left: '96%' }], { duration: d });
      return k.done();
    }
  },
  {
    id: 'beat',
    name: 'Beat',
    aliases: ['beat', 'temps fort', 'on beat', 'sur le temps'],
    category: 'structure',
    definition:
      'Le temps fort de la musique (les “boum” réguliers). Caler les changements visuels sur le beat rend la vidéo naturellement satisfaisante.',
    whenToUse: 'Pour synchroniser apparitions, coupes et changements de mots avec la musique (ex. 120 BPM = un beat toutes les 0,5 s).',
    mistake: 'Animer à contretemps sans le vouloir : la vidéo semble “décalée” même si on ne sait pas dire pourquoi.',
    promptWord: 'synchronisé sur le beat à 120 BPM (un changement toutes les 0,5 s)',
    params: { duration: 0.5, easingName: 'expo out', easingCss: EASE.expoOut, delay: 0, extra: [['Tempo', '120 BPM'], ['Beats', '6']] },
    demo: (ctx) => {
      const k = kit(ctx);
      const L = layer(k.stage);
      const ring = el(L, `position:absolute;width:30cqw;height:30cqw;border-radius:50%;border:.8cqw solid #ff3d9a;`);
      const words = ['Un', 'site', 'qui', 'bat', 'au', 'rythme.'];
      const beat = k.p.duration;
      words.forEach((w, i) => {
        const e = el(L, `position:absolute;${textStyle(7)}`, w);
        k.a(e, [{ opacity: 0, transform: 'scale(1.3)' }, { opacity: 1, transform: 'scale(1)', offset: 0.3 }, { opacity: 1, transform: 'scale(1)', offset: 0.9 }, { opacity: i === words.length - 1 ? 1 : 0 }], {
          duration: beat,
          delay: 0.2 + i * beat
        });
        k.a(ring, [{ transform: 'scale(1.18)', opacity: 1 }, { transform: 'scale(1)', opacity: 0.25 }], { duration: beat, easing: k.p.easingCss, delay: 0.2 + i * beat, fill: 'forwards' });
      });
      const dots = el(k.stage, 'position:absolute;left:50%;bottom:7%;transform:translateX(-50%);display:flex;gap:2cqw;');
      words.forEach((_, i) => {
        const dot = el(dots, `width:2cqw;height:2cqw;border-radius:50%;background:${MUTED};opacity:.3;`);
        k.a(dot, [{ opacity: 0.3 }, { opacity: 1, background: '#ff3d9a' }], { duration: 0.05, delay: 0.2 + i * beat, fill: 'forwards' });
      });
      return k.done();
    }
  },
  {
    id: 'loop',
    name: 'Boucle (loop)',
    aliases: ['loop', 'boucle', 'seamless loop', 'boucle parfaite'],
    category: 'structure',
    definition:
      'Une animation dont la dernière image est identique à la première, pour qu’elle puisse se répéter sans coupure visible. Sur les réseaux, une boucle parfaite augmente le temps de visionnage.',
    whenToUse: 'Pour une vidéo courte qui tourne en boucle, ou un élément de fond (motif, halo).',
    mistake: 'Une petite différence entre la fin et le début : on voit un “saut” à chaque répétition.',
    promptWord: 'boucle parfaite (seamless loop) : état final = état initial, période 2 s',
    params: { duration: 2, easingName: 'linear', easingCss: EASE.linear, delay: 0, extra: [['Répétitions', '3'], ['Période', '2 s']] },
    demo: (ctx) => {
      const k = kit(ctx);
      const L = layer(k.stage);
      const ring = el(L, 'position:absolute;width:36cqw;height:36cqw;');
      for (let i = 0; i < 8; i++) {
        el(ring, `position:absolute;left:50%;top:0;width:3cqw;height:3cqw;margin-left:-1.5cqw;border-radius:50%;background:${GRADIENT};transform-origin:1.5cqw 18cqw;transform:rotate(${i * 45}deg);opacity:${0.25 + i * 0.1};`);
      }
      const counter = el(L, textStyle(6), '×1');
      k.a(ring, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(45deg)' }], { duration: k.p.duration / 4, easing: k.p.easingCss, iterations: 12 });
      [2, 3].forEach((n, i) => {
        const c = el(L, `position:absolute;${textStyle(6)};background:${BG};`, `×${n}`);
        k.a(c, [{ opacity: 0 }, { opacity: 1 }], { duration: 0.01, delay: (i + 1) * k.p.duration });
      });
      void counter;
      return k.done();
    }
  },
  {
    id: 'safe-zones',
    name: 'Safe zones',
    aliases: ['safe zone', 'safe zones', 'zones de sécurité', 'safe area'],
    category: 'structure',
    definition:
      'Les zones de l’écran qui ne seront pas cachées par l’interface du réseau (pseudo, légende, boutons j’aime/partage). Tout texte important doit rester dedans.',
    whenToUse: 'Toujours en 9:16 pour TikTok, Reels et Shorts : environ 14 % en haut, 20 % en bas et 15 % à droite sont risqués.',
    mistake: 'Placer le CTA tout en bas : il finit sous la légende et les boutons de l’app.',
    promptWord: 'safe zones 9:16 : marges de 250 px en haut, 380 px en bas, 160 px à droite (sur 1080×1920)',
    params: { duration: 0.6, easingName: 'expo out', easingCss: EASE.expoOut, delay: 0.3, extra: [['Haut / bas / droite', '13 % / 20 % / 15 %']] },
    demo: (ctx) => {
      const k = kit(ctx);
      const L = layer(k.stage);
      const ph = el(L, `position:relative;width:30cqw;height:53.3cqw;border-radius:2.4cqw;background:${SURFACE};box-shadow:0 0 0 .4cqw ${INK};overflow:hidden;`);
      const zone = (css: string) => el(ph, `position:absolute;${css}background:repeating-linear-gradient(45deg, rgba(255,61,154,.22) 0 1cqw, transparent 1cqw 2cqw);`);
      const top = zone('left:0;right:0;top:0;height:13%;');
      const bottom = zone('left:0;right:0;bottom:0;height:20%;');
      const right = zone('right:0;top:13%;bottom:20%;width:15%;');
      [0, 1, 2].forEach((i) => el(right, `position:absolute;right:20%;top:${30 + i * 18}%;width:3.2cqw;height:3.2cqw;border-radius:50%;background:${MUTED};opacity:.7;`));
      el(bottom, `position:absolute;left:6%;bottom:22%;width:60%;height:1.4cqw;border-radius:1cqw;background:${MUTED};opacity:.7;`);
      const safe = el(ph, `position:absolute;left:4%;right:15%;top:13%;bottom:20%;border:.35cqw dashed #3d7bff;border-radius:1cqw;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.4cqw;`);
      el(safe, textStyle(3.6), 'Message');
      el(safe, `padding:.6cqw 1.8cqw;border-radius:99cqw;background:${GRADIENT};${textStyle(2.4, 700, '#fff')}`, 'CTA');
      [top, bottom, right].forEach((z, i) => k.a(z, [{ opacity: 0 }, { opacity: 1 }], { duration: k.p.duration, easing: k.p.easingCss, delay: k.p.delay + i * 0.15 }));
      k.a(safe, [{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'scale(1)' }], { duration: k.p.duration, easing: k.p.easingCss, delay: k.p.delay + 0.6 });
      el(k.stage, `position:absolute;right:4%;top:44%;${textStyle(2.8, 600, MUTED)}`, 'zone à risque');
      return k.done();
    }
  },
  {
    id: 'hook',
    name: 'Hook (accroche)',
    aliases: ['hook', 'accroche'],
    category: 'structure',
    definition:
      'Les 1 à 2 premières secondes, conçues pour arrêter le scroll : un mot fort, un contraste, un mouvement franc. Sans hook, personne ne voit la suite.',
    whenToUse: 'Au tout début de chaque pub réseau social, avant toute présentation de marque.',
    mistake: 'Commencer par le logo ou une intro lente : 50 % des gens ont déjà scrollé.',
    promptWord: 'hook 0–1,2 s : mot unique plein cadre, scale 1.4 → 1 en 0,35 s expo out, aucune intro',
    params: { duration: 0.35, easingName: 'expo out', easingCss: EASE.expoOut, delay: 0.15, extra: [['Fenêtre', '0 → 1,2 s']] },
    demo: (ctx) => {
      const k = kit(ctx);
      const flash = el(k.stage, `position:absolute;inset:0;background:${GRADIENT};opacity:0;`);
      const L = layer(k.stage);
      const t = el(L, textStyle(15), 'STOP.');
      k.a(flash, [{ opacity: 0.9 }, { opacity: 0 }], { duration: 0.3, delay: k.p.delay, fill: 'forwards' });
      const s = springSamples(260, 18);
      k.a(t, [{ transform: 'scale(1.4)', opacity: 0, offset: 0 }, ...s.map((v, i) => ({ transform: `scale(${1.4 - 0.4 * v})`, opacity: 1, offset: (i + 1) / (s.length + 1) })), { transform: 'scale(1)', opacity: 1, offset: 1 }], {
        duration: k.p.duration * 2.4,
        delay: k.p.delay
      });
      const bar = el(k.stage, `position:absolute;left:4%;right:4%;bottom:6%;height:1cqw;border-radius:1cqw;background:${MUTED};opacity:.25;`);
      const fill = el(bar, `position:absolute;left:0;top:0;bottom:0;width:100%;border-radius:1cqw;background:${GRADIENT};transform-origin:left;`);
      el(k.stage, `position:absolute;left:4%;bottom:9%;${textStyle(2.6, 600, MUTED)}`, '0 s');
      el(k.stage, `position:absolute;right:4%;bottom:9%;${textStyle(2.6, 600, MUTED)}`, '1,2 s');
      k.a(fill, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 1.2, delay: k.p.delay });
      return k.done();
    }
  },

  // ───────────── Formats ─────────────
  {
    id: 'ratio-9-16',
    name: '9:16 (vertical)',
    aliases: ['9:16', 'format vertical'],
    category: 'formats',
    definition: 'Format vertical plein écran du téléphone, 1080 × 1920 px. C’est le format natif de TikTok, Reels et Shorts.',
    whenToUse: 'Pour toute pub TikTok / Instagram Reels / Stories.',
    mistake: 'Oublier les safe zones : en 9:16, l’interface de l’app recouvre le haut, le bas et la droite.',
    promptWord: 'format 9:16 (1080 × 1920 px)',
    params: { duration: 0.8, easingName: 'expo out', easingCss: EASE.expoOut, delay: 0.2, extra: [['Pixels', '1080 × 1920']] },
    demo: formatDemo([9, 16], '1080 × 1920 px', 'TikTok · Reels · Stories')
  },
  {
    id: 'ratio-4-5',
    name: '4:5 (portrait)',
    aliases: ['4:5', 'format portrait'],
    category: 'formats',
    definition: 'Format portrait 1080 × 1350 px. Il occupe le maximum de place dans le fil Instagram et LinkedIn sans être plein écran.',
    whenToUse: 'Pour une pub dans le fil Instagram ou LinkedIn (feed).',
    mistake: 'Recadrer simplement une vidéo 9:16 : le haut et le bas du texte sont coupés.',
    promptWord: 'format 4:5 (1080 × 1350 px)',
    params: { duration: 0.8, easingName: 'expo out', easingCss: EASE.expoOut, delay: 0.2, extra: [['Pixels', '1080 × 1350']] },
    demo: formatDemo([4, 5], '1080 × 1350 px', 'Fil Instagram · LinkedIn')
  },
  {
    id: 'ratio-1-1',
    name: '1:1 (carré)',
    aliases: ['1:1', 'format carré'],
    category: 'formats',
    definition: 'Format carré 1080 × 1080 px. Universel, il s’affiche correctement partout, mais occupe moins d’espace que le 4:5.',
    whenToUse: 'Quand une seule vidéo doit servir sur plusieurs réseaux et dans des emplacements variés.',
    mistake: 'Composer comme en 16:9 : les éléments sur les côtés sont coupés.',
    promptWord: 'format 1:1 (1080 × 1080 px)',
    params: { duration: 0.8, easingName: 'expo out', easingCss: EASE.expoOut, delay: 0.2, extra: [['Pixels', '1080 × 1080']] },
    demo: formatDemo([1, 1], '1080 × 1080 px', 'Multi-plateforme')
  },
  {
    id: 'ratio-16-9',
    name: '16:9 (paysage)',
    aliases: ['16:9', 'format paysage', 'format horizontal'],
    category: 'formats',
    definition: 'Format paysage 1920 × 1080 px, celui de la télévision et de YouTube. Sur mobile, il est petit dans le fil.',
    whenToUse: 'Pour YouTube, un site web, une présentation ou LinkedIn en lecture desktop.',
    mistake: 'Le publier tel quel sur TikTok : bandes noires énormes et texte minuscule.',
    promptWord: 'format 16:9 (1920 × 1080 px)',
    params: { duration: 0.8, easingName: 'expo out', easingCss: EASE.expoOut, delay: 0.2, extra: [['Pixels', '1920 × 1080']] },
    demo: formatDemo([16, 9], '1920 × 1080 px', 'YouTube · Web · Desktop')
  },
  {
    id: 'fps',
    name: 'FPS (images par seconde)',
    aliases: ['fps', 'frame rate', 'images par seconde', '60 fps'],
    category: 'formats',
    definition:
      'Le nombre d’images affichées chaque seconde. À 60 fps le mouvement est fluide ; à 12 fps il paraît saccadé, ce qui peut aussi être un choix de style.',
    whenToUse: 'Viser 60 fps pour une animation navigateur enregistrée à l’écran ; 24/30 fps pour un rendu “cinéma”.',
    mistake: 'Animer des propriétés lourdes (width, top, box-shadow) : le navigateur chute sous 60 fps et l’enregistrement saccade.',
    promptWord: '60 fps cible (animer uniquement transform et opacity)',
    params: { duration: 3, easingName: 'ease-in-out', easingCss: EASE.inOut, delay: 0, extra: [['Comparaison', '12 fps vs 60 fps']] },
    demo: (ctx) => {
      const k = kit(ctx);
      const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
      const cs = getComputedStyle(k.stage);
      const ink = cs.getPropertyValue('--demo-ink').trim() || '#0d0d14';
      const muted = cs.getPropertyValue('--demo-muted').trim() || '#8a8c99';
      k.canvas(k.p.duration, (t, g, w, h) => {
        g.clearRect(0, 0, w, h);
        const period = 1.5;
        const pos = (time: number) => {
          const ph = (time % period) / period;
          return ph < 0.5 ? ease(ph * 2) : 1 - ease((ph - 0.5) * 2);
        };
        const rows: Array<[number, number, string]> = [
          [h * 0.33, 12, '12 fps'],
          [h * 0.72, 60, '60 fps']
        ];
        g.font = `600 ${w * 0.03}px ${FONT}`;
        for (const [y, fps, txt] of rows) {
          const q = Math.floor(t * fps) / fps;
          const x = w * 0.2 + pos(q) * w * 0.65;
          g.fillStyle = muted;
          g.fillText(txt, w * 0.04, y + w * 0.01);
          g.globalAlpha = 0.3;
          g.fillRect(w * 0.2, y, w * 0.65, 1);
          g.globalAlpha = 1;
          const grad = g.createLinearGradient(x - w * 0.04, 0, x + w * 0.04, 0);
          grad.addColorStop(0, '#3d7bff');
          grad.addColorStop(0.55, '#ff3d9a');
          grad.addColorStop(1, '#ff8a3d');
          g.fillStyle = grad;
          g.beginPath();
          g.arc(x, y, w * 0.04, 0, Math.PI * 2);
          g.fill();
        }
        g.fillStyle = ink;
      });
      return k.done();
    }
  },
  {
    id: 'duration',
    name: 'Durée totale',
    aliases: ['durée totale', 'runtime', 'durée'],
    category: 'formats',
    definition:
      'La longueur totale de la vidéo, à répartir entre les scènes. Pour une pub réseau, 10 à 20 s est la zone idéale ; chaque seconde doit être justifiée.',
    whenToUse: 'Au moment du brief : fixer la durée avant d’écrire les scènes, puis en déduire le nombre de messages.',
    mistake: 'Viser 30 s “pour tout dire” : le taux de visionnage complet s’effondre.',
    promptWord: 'durée totale 15 s (hook 0–1,5 s · message 1,5–11 s · CTA 11–15 s)',
    params: { duration: 3, easingName: 'linear (lecture accélérée ×5)', easingCss: EASE.linear, delay: 0, extra: [['Durée simulée', '15 s'], ['Accéléré', '×5']] },
    demo: (ctx) => {
      const k = kit(ctx);
      const parts: Array<[string, number, string]> = [
        ['Hook', 1.5, '#3d7bff'],
        ['Message', 9.5, '#ff3d9a'],
        ['CTA', 4, '#ff8a3d']
      ];
      const bar = el(k.stage, 'position:absolute;left:6%;right:6%;top:46%;height:12cqw;display:flex;gap:.6cqw;');
      parts.forEach(([n, s, c]) => el(bar, `flex:${s};border-radius:1.4cqw;background:${c};opacity:.85;display:flex;align-items:center;justify-content:center;${textStyle(3, 700, '#fff')}`, n));
      const cur = el(k.stage, `position:absolute;left:6%;top:40%;height:24cqw;width:.6cqw;background:${INK};`);
      k.a(cur, [{ left: '6%' }, { left: '94%' }], { duration: k.p.duration });
      const counter = el(k.stage, `position:absolute;left:50%;top:14%;transform:translateX(-50%);${textStyle(8)}`, '0 s');
      for (let s = 1; s <= 15; s++) {
        const c = el(k.stage, `position:absolute;left:50%;top:14%;transform:translateX(-50%);${textStyle(8)};background:${BG};padding:0 2cqw;`, `${s} s`);
        k.a(c, [{ opacity: 0 }, { opacity: 1 }], { duration: 0.01, delay: (s / 15) * k.p.duration - 0.01 });
      }
      void counter;
      return k.done();
    }
  }
];
