// Mini boîte à outils pour écrire les démos animées du glossaire
// (Web Animations API + Canvas, aucun asset externe).

export interface DemoParams {
  /** Durée principale en secondes. */
  duration: number;
  /** Nom lisible de l'easing (affiché). */
  easingName: string;
  /** Valeur CSS réellement utilisée. */
  easingCss: string;
  /** Délai ou décalage (stagger) en secondes. */
  delay: number;
  /** Paramètres complémentaires affichés tels quels. */
  extra?: Array<[string, string]>;
}

export interface DemoRun {
  animations: Animation[];
  finished: Promise<void>;
  stop: () => void;
}

export interface DemoCtx {
  stage: HTMLDivElement;
  speed: () => number;
  p: DemoParams;
}

export type DemoFn = (ctx: DemoCtx) => DemoRun;

export const EASE = {
  linear: 'linear',
  in: 'cubic-bezier(0.42, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.58, 1)',
  inOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
  expoOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  expoIn: 'cubic-bezier(0.7, 0, 0.84, 0)',
  expoInOut: 'cubic-bezier(0.87, 0, 0.13, 1)',
  backOut: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  quartOut: 'cubic-bezier(0.25, 1, 0.5, 1)'
} as const;

export const GRADIENT = 'linear-gradient(100deg, #3d7bff, #ff3d9a 55%, #ff8a3d)';
export const INK = 'var(--demo-ink)';
export const MUTED = 'var(--demo-muted)';
export const SURFACE = 'var(--demo-surface)';
export const BG = 'var(--demo-bg)';
export const FONT = '"Figtree", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

/** Simule un ressort amorti et renvoie des échantillons normalisés de 0 → 1. */
export function springSamples(stiffness = 170, damping = 11, mass = 1, n = 48): number[] {
  const dt = 1 / 600;
  let x = 0;
  let v = 0;
  const raw: number[] = [];
  let t = 0;
  while (t < 4) {
    const f = -stiffness * (x - 1) - damping * v;
    v += (f / mass) * dt;
    x += v * dt;
    raw.push(x);
    t += dt;
    if (t > 0.3 && Math.abs(x - 1) < 0.0008 && Math.abs(v) < 0.01) break;
  }
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.round((i / (n - 1)) * (raw.length - 1));
    out.push(raw[idx] ?? 1);
  }
  out[out.length - 1] = 1;
  return out;
}

export function el(parent: HTMLElement, css: string, text = '', tag: keyof HTMLElementTagNameMap = 'div'): HTMLElement {
  const e = document.createElement(tag);
  e.style.cssText = css;
  if (text) e.textContent = text;
  parent.appendChild(e);
  return e;
}

/** Calque plein cadre qui centre son contenu (les enfants animent librement leur transform). */
export function layer(parent: HTMLElement, extra = ''): HTMLElement {
  return el(parent, `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;${extra}`);
}

export function label(parent: HTMLElement, text: string, pos = 'left:4%;top:5%'): HTMLElement {
  return el(
    parent,
    `position:absolute;${pos};font:600 3.2cqw/1 ${FONT};color:${MUTED};letter-spacing:0.02em;text-transform:uppercase;`,
    text
  );
}

export function textStyle(size: number, weight = 700, color = INK): string {
  return `font:${weight} ${size}cqw/1.05 ${FONT};letter-spacing:-0.035em;color:${color};white-space:nowrap;`;
}

interface AnimOpts {
  duration: number;
  easing?: string;
  delay?: number;
  fill?: FillMode;
  iterations?: number;
  direction?: PlaybackDirection;
}

export interface Kit {
  stage: HTMLDivElement;
  p: DemoParams;
  /** Lance une animation (durées en secondes) et la référence pour le lecteur. */
  a: (target: Element, keyframes: Keyframe[], o: AnimOpts) => Animation;
  /** Boucle Canvas pendant `seconds` (temps accéléré/ralenti par le curseur de vitesse). */
  canvas: (seconds: number, draw: (t: number, g: CanvasRenderingContext2D, w: number, h: number) => void, css?: string) => HTMLCanvasElement;
  /** Petit graphe de la courbe d'easing, avec un point qui la parcourt. */
  curve: (easingCss: string, seconds: number, delay?: number, samples?: number[]) => void;
  done: () => DemoRun;
}

export function kit(ctx: DemoCtx): Kit {
  const anims: Animation[] = [];
  const extraFinished: Promise<void>[] = [];
  const stops: Array<() => void> = [];
  const { stage, speed, p } = ctx;

  const a: Kit['a'] = (target, keyframes, o) => {
    const anim = target.animate(keyframes, {
      duration: o.duration * 1000,
      easing: o.easing ?? 'linear',
      delay: (o.delay ?? 0) * 1000,
      fill: o.fill ?? 'both',
      iterations: o.iterations ?? 1,
      direction: o.direction ?? 'normal'
    });
    anim.playbackRate = speed();
    anims.push(anim);
    return anim;
  };

  const canvas: Kit['canvas'] = (seconds, draw, css = '') => {
    const c = el(stage, `position:absolute;inset:0;width:100%;height:100%;${css}`, '', 'canvas') as HTMLCanvasElement;
    const g = c.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      const r = stage.getBoundingClientRect();
      c.width = Math.max(1, Math.round(r.width * dpr));
      c.height = Math.max(1, Math.round(r.height * dpr));
    };
    resize();
    let raf = 0;
    let last = performance.now();
    let t = 0;
    let stopped = false;
    const finished = new Promise<void>((resolve) => {
      const tick = (now: number) => {
        if (stopped) return resolve();
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        t = Math.min(seconds, t + dt * speed());
        if (g) {
          g.setTransform(dpr, 0, 0, dpr, 0, 0);
          draw(t, g, c.width / dpr, c.height / dpr);
        }
        if (t >= seconds) return resolve();
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    stops.push(() => {
      stopped = true;
      cancelAnimationFrame(raf);
    });
    extraFinished.push(finished);
    return c;
  };

  const curve: Kit['curve'] = (easingCss, seconds, delay = 0, samples) => {
    const box = el(
      stage,
      `position:absolute;right:3%;bottom:5%;width:19cqw;height:19cqw;border-left:1px solid ${MUTED};border-bottom:1px solid ${MUTED};opacity:.85;`
    );
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;overflow:visible;';
    const path = document.createElementNS(svgNS, 'path');
    let d = '';
    if (samples) {
      const min = Math.min(0, ...samples);
      const max = Math.max(1, ...samples);
      d = samples.map((v, i) => `${i ? 'L' : 'M'}${(i / (samples.length - 1)) * 100},${100 - ((v - min) / (max - min)) * 100}`).join(' ');
    } else {
      const m = easingCss.match(/cubic-bezier\(([^)]+)\)/);
      const [x1, y1, x2, y2] = m?.[1]?.split(',').map((s) => parseFloat(s)) ?? [0, 0, 1, 1];
      d = `M0,100 C${(x1 ?? 0) * 100},${100 - (y1 ?? 0) * 100} ${(x2 ?? 1) * 100},${100 - (y2 ?? 1) * 100} 100,0`;
    }
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'url(#g)');
    path.setAttribute('stroke-width', '3');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    const defs = document.createElementNS(svgNS, 'defs');
    defs.innerHTML = '<linearGradient id="g"><stop offset="0" stop-color="#3d7bff"/><stop offset=".55" stop-color="#ff3d9a"/><stop offset="1" stop-color="#ff8a3d"/></linearGradient>';
    svg.appendChild(defs);
    svg.appendChild(path);
    box.appendChild(svg);
    // Le point avance linéairement en x (temps) et selon l'easing en y (progression).
    const xWrap = el(box, 'position:absolute;left:0;bottom:0;width:100%;height:100%;');
    const yWrap = el(xWrap, 'position:absolute;left:0;bottom:0;width:0;height:100%;');
    const dot = el(yWrap, `position:absolute;left:-1.1cqw;bottom:-1.1cqw;width:2.2cqw;height:2.2cqw;border-radius:50%;background:${INK};`);
    void dot;
    a(xWrap, [{ transform: 'translateX(0)' }, { transform: 'translateX(100%)' }], { duration: seconds, delay });
    if (samples) {
      const min = Math.min(0, ...samples);
      const max = Math.max(1, ...samples);
      a(
        yWrap,
        samples.map((v) => ({ transform: `translateY(${-((v - min) / (max - min)) * 100}%)` })),
        { duration: seconds, delay }
      );
    } else {
      a(yWrap, [{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }], { duration: seconds, delay, easing: easingCss });
    }
  };

  return {
    stage,
    p,
    a,
    canvas,
    curve,
    done: () => ({
      animations: anims,
      finished: Promise.all([
        ...anims.map((x) => x.finished.then(() => undefined).catch(() => undefined)),
        ...extraFinished
      ]).then(() => undefined),
      stop: () => {
        stops.forEach((s) => s());
        anims.forEach((x) => {
          try {
            x.cancel();
          } catch {
            /* déjà annulée */
          }
        });
      }
    })
  };
}
