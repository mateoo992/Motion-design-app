import { useLiveQuery } from 'dexie-react-hooks';
import { useId } from 'react';
import { db } from '../db/db';
import { TERMS } from '../glossary';
import { BRIEF_LABELS, briefProgress, emptyScene } from '../lib/brief';
import { cx } from '../lib/utils';
import { useProject } from '../store/project';
import type { Aspect, Brief, BriefKey, Scene } from '../types';
import { ASPECTS } from '../types';
import { Icon } from './ui';

const TEXT_FIELDS: Array<{ key: Exclude<BriefKey, 'scenes' | 'onScreenTexts' | 'format' | 'styleId'>; placeholder: string; multiline?: boolean }> = [
  { key: 'objective', placeholder: 'Ex. : obtenir 10 demandes de devis par mois' },
  { key: 'target', placeholder: 'Ex. : artisans et TPE locales sans site efficace' },
  { key: 'platform', placeholder: 'Ex. : Instagram Reels + TikTok' },
  { key: 'duration', placeholder: 'En secondes, ex. : 15' },
  { key: 'message', placeholder: 'La phrase unique à retenir', multiline: true },
  { key: 'cta', placeholder: 'Ex. : Réservez votre appel gratuit' },
  { key: 'tone', placeholder: 'Ex. : premium sobre, confiant' },
  { key: 'references', placeholder: 'Ex. : pubs Linear, Vercel, Apple', multiline: true },
  { key: 'styleNotes', placeholder: 'Direction créative retenue', multiline: true }
];

export function BriefPanel() {
  const project = useProject((s) => s.project);
  const patch = useProject((s) => s.patch);
  const styles = useLiveQuery(() => db.styles.orderBy('name').toArray(), [], []);
  const listId = useId();
  if (!project) return null;
  const { brief, lockedFields } = project;
  const progress = Math.round(briefProgress(brief) * 100);

  const setField = <K extends BriefKey>(key: K, value: Brief[K]) =>
    patch((p) => ({
      ...p,
      brief: { ...p.brief, [key]: value },
      lockedFields: p.lockedFields.includes(key) ? p.lockedFields : [...p.lockedFields, key]
    }));

  const toggleLock = (key: BriefKey) =>
    patch((p) => ({
      ...p,
      lockedFields: p.lockedFields.includes(key) ? p.lockedFields.filter((k) => k !== key) : [...p.lockedFields, key]
    }));

  const setScenes = (scenes: Scene[]) => setField('scenes', scenes);
  const updateScene = (id: string, part: Partial<Scene>) => setScenes(brief.scenes.map((s) => (s.id === id ? { ...s, ...part } : s)));

  const LockBtn = ({ k }: { k: BriefKey }) => {
    const locked = lockedFields.includes(k);
    return (
      <button
        type="button"
        onClick={() => toggleLock(k)}
        className={cx('rounded-md p-0.5', locked ? 'text-fg' : 'text-muted/60 hover:text-muted')}
        title={locked ? 'Modifié à la main : l’IA ne l’écrasera pas (cliquer pour déverrouiller)' : 'Rempli par l’IA (cliquer pour verrouiller)'}
        aria-label={locked ? `Déverrouiller ${BRIEF_LABELS[k]}` : `Verrouiller ${BRIEF_LABELS[k]}`}
        aria-pressed={locked}
      >
        <Icon name={locked ? 'lock' : 'unlock'} className="h-3.5 w-3.5" />
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between text-xs font-semibold">
          <span>Brief</span>
          <span className="text-muted">{progress} %</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line/10" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Complétude du brief">
          <div className="h-full rounded-full gradient-bg transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {TEXT_FIELDS.map(({ key, placeholder, multiline }) => {
        const id = `brief-${key}`;
        const value = brief[key];
        return (
          <div key={key}>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor={id} className="label mb-0">
                {BRIEF_LABELS[key]}
              </label>
              <LockBtn k={key} />
            </div>
            {multiline ? (
              <textarea id={id} rows={2} className="input resize-y" value={value} placeholder={placeholder} onChange={(e) => setField(key, e.target.value)} />
            ) : (
              <input id={id} className="input" value={value} placeholder={placeholder} onChange={(e) => setField(key, e.target.value)} />
            )}
          </div>
        );
      })}

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="label mb-0">Format</span>
          <LockBtn k="format" />
        </div>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Format">
          {ASPECTS.map((a) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={brief.format === a}
              className={cx('chip', brief.format === a && 'chip-active')}
              onClick={() => setField('format', (brief.format === a ? '' : a) as Aspect | '')}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="brief-style">
          Style de la bibliothèque
        </label>
        <select id="brief-style" className="input" value={brief.styleId ?? ''} onChange={(e) => setField('styleId', e.target.value || null)}>
          <option value="">— Aucun —</option>
          {styles.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="label mb-0">Scènes ({brief.scenes.length})</span>
          <div className="flex items-center gap-1">
            <LockBtn k="scenes" />
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => {
                const lastEnd = brief.scenes.reduce((m, s) => Math.max(m, s.end ?? 0), 0);
                setScenes([...brief.scenes, emptyScene(lastEnd, lastEnd + 2.5)]);
              }}
            >
              <Icon name="plus" className="h-3.5 w-3.5" /> Scène
            </button>
          </div>
        </div>
        <datalist id={listId}>
          {TERMS.map((t) => (
            <option key={t.id} value={t.name} />
          ))}
        </datalist>
        <ol className="space-y-2">
          {brief.scenes.map((s, i) => (
            <li key={s.id} className="rounded-xl border border-line/10 bg-surface/50 p-2.5">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
                <span className="text-muted">Scène {i + 1}</span>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  aria-label={`Début de la scène ${i + 1} (s)`}
                  className="input w-[4.5rem] px-2 py-1 text-xs"
                  value={s.start ?? ''}
                  onChange={(e) => updateScene(s.id, { start: e.target.value === '' ? null : parseFloat(e.target.value) })}
                />
                <span aria-hidden>→</span>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  aria-label={`Fin de la scène ${i + 1} (s)`}
                  className="input w-[4.5rem] px-2 py-1 text-xs"
                  value={s.end ?? ''}
                  onChange={(e) => updateScene(s.id, { end: e.target.value === '' ? null : parseFloat(e.target.value) })}
                />
                <span className="text-muted">s</span>
                <button type="button" className="ml-auto text-muted hover:text-danger" aria-label={`Supprimer la scène ${i + 1}`} onClick={() => setScenes(brief.scenes.filter((x) => x.id !== s.id))}>
                  <Icon name="close" className="h-4 w-4" />
                </button>
              </div>
              <input className="input mb-1.5 py-1.5 text-xs" aria-label={`Texte à l’écran, scène ${i + 1}`} placeholder="Texte exact à l’écran" value={s.text} onChange={(e) => updateScene(s.id, { text: e.target.value })} />
              <div className="grid grid-cols-2 gap-1.5">
                <input className="input py-1.5 text-xs" list={listId} aria-label={`Effet, scène ${i + 1}`} placeholder="Effet (ex. Blur-to-sharp)" value={s.effect} onChange={(e) => updateScene(s.id, { effect: e.target.value })} />
                <input className="input py-1.5 text-xs" list={listId} aria-label={`Transition, scène ${i + 1}`} placeholder="Transition (ex. Wipe)" value={s.transition} onChange={(e) => updateScene(s.id, { transition: e.target.value })} />
              </div>
            </li>
          ))}
        </ol>
        {brief.scenes.length === 0 && <p className="text-xs text-muted">Les scènes apparaîtront ici quand une direction sera choisie. Tu peux aussi les ajouter à la main.</p>}
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="brief-texts" className="label mb-0">
            Textes à l’écran (un par ligne)
          </label>
          <LockBtn k="onScreenTexts" />
        </div>
        <textarea
          id="brief-texts"
          rows={3}
          className="input resize-y"
          value={brief.onScreenTexts.join('\n')}
          onChange={(e) => setField('onScreenTexts', e.target.value.split('\n'))}
          onBlur={(e) => setField('onScreenTexts', e.target.value.split('\n').map((t) => t.trim()).filter(Boolean))}
        />
      </div>
    </div>
  );
}
