import { useCallback, useEffect, useRef, useState } from 'react';
import type { Term } from '../glossary';
import type { DemoRun } from '../glossary/kit';
import { Icon } from './ui';

interface Props {
  term: Term;
  /** Rejoue automatiquement la démo en boucle (utilisé par le quiz). */
  loop?: boolean;
  /** Masque les contrôles et paramètres (quiz). */
  bare?: boolean;
}

const fmt = (n: number) => `${String(Math.round(n * 1000) / 1000).replace('.', ',')} s`;

export function DemoPlayer({ term, loop = false, bare = false }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const runRef = useRef<DemoRun | null>(null);
  const speedRef = useRef(1);
  const [speed, setSpeed] = useState(1);
  const [runId, setRunId] = useState(0);
  const [playing, setPlaying] = useState(false);

  const replay = useCallback(() => setRunId((n) => n + 1), []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let cancelled = false;
    let loopTimer: ReturnType<typeof setTimeout> | undefined;
    stage.replaceChildren();
    const run = term.demo({ stage, speed: () => speedRef.current, p: term.params });
    runRef.current = run;
    setPlaying(true);
    run.finished.then(() => {
      if (cancelled) return;
      setPlaying(false);
      if (loop) loopTimer = setTimeout(() => !cancelled && setRunId((n) => n + 1), 700 / speedRef.current);
    });
    return () => {
      cancelled = true;
      if (loopTimer) clearTimeout(loopTimer);
      run.stop();
      runRef.current = null;
    };
  }, [term, runId, loop]);

  const changeSpeed = (v: number) => {
    speedRef.current = v;
    setSpeed(v);
    runRef.current?.animations.forEach((a) => {
      a.playbackRate = v;
    });
  };

  return (
    <div>
      <div
        ref={stageRef}
        className="demo-stage relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-line/10"
        role="img"
        aria-label={`Démonstration animée : ${bare ? 'terme à deviner' : term.name}`}
      />
      {!bare && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn-primary btn-sm" onClick={replay}>
              <Icon name="replay" className="h-4 w-4" />
              {playing ? 'Relancer' : 'Rejouer'}
            </button>
            <label className="flex flex-1 items-center gap-2 text-xs font-semibold text-muted">
              Vitesse
              <input
                type="range"
                min={0.25}
                max={2}
                step={0.25}
                value={speed}
                onChange={(e) => changeSpeed(parseFloat(e.target.value))}
                className="flex-1 accent-[rgb(var(--accent))]"
                aria-valuetext={`${speed} fois`}
              />
              <span className="w-10 text-right tabular-nums text-fg">×{speed}</span>
            </label>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            <Param k="Durée" v={fmt(term.params.duration)} />
            <Param k="Easing" v={term.params.easingName} title={term.params.easingCss} />
            <Param k="Délai / stagger" v={fmt(term.params.delay)} />
            {term.params.extra?.map(([k, v]) => <Param key={k} k={k} v={v} />)}
          </dl>
          {term.params.easingCss.startsWith('cubic-bezier') && (
            <p className="font-mono text-[11px] text-muted">{term.params.easingCss}</p>
          )}
        </div>
      )}
    </div>
  );
}

function Param({ k, v, title }: { k: string; v: string; title?: string }) {
  return (
    <div className="rounded-xl border border-line/10 bg-surface/60 px-3 py-2" title={title}>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">{k}</dt>
      <dd className="mt-0.5 font-semibold">{v}</dd>
    </div>
  );
}
