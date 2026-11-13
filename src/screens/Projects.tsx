import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useRef, useState } from 'react';
import { ConfirmButton, EmptyState, Field, Icon, Notice, PageHeader, Segmented, TextField } from '../components/ui';
import { clearAllData, db } from '../db/db';
import { exportAll, importAll } from '../lib/backup';
import { briefProgress } from '../lib/brief';
import { cx, downloadText, formatDate, normalize, uid } from '../lib/utils';
import { listOllamaModels, toProviderError } from '../providers';
import { useProject } from '../store/project';
import { CLAUDE_MODELS, DEFAULT_CLAUDE_MODEL, useSettings } from '../store/settings';
import { useUI } from '../store/ui';
import type { Project, ProviderMode, TextSize, ThemeMode } from '../types';

export function ProjectsScreen() {
  const [view, setView] = useState<'projects' | 'settings'>('projects');
  return (
    <div>
      <PageHeader
        title={view === 'projects' ? 'Projets' : 'Réglages'}
        subtitle={view === 'projects' ? 'Historique de tes projets : brief, conversation, versions de prompts et notes.' : 'Moteur IA, apparence et données. Tout reste sur cet appareil.'}
        actions={
          <Segmented
            label="Section"
            value={view}
            onChange={setView}
            options={[
              { value: 'projects', label: 'Projets' },
              { value: 'settings', label: 'Réglages' }
            ]}
          />
        }
      />
      {view === 'projects' ? <ProjectList /> : <SettingsPanel />}
    </div>
  );
}

function ProjectList() {
  const projects = useLiveQuery(() => db.projects.orderBy('updatedAt').reverse().toArray(), [], undefined);
  const current = useProject((s) => s.project);
  const open = useProject((s) => s.open);
  const create = useProject((s) => s.create);
  const refresh = useProject((s) => s.refresh);
  const setTab = useUI((s) => s.setTab);
  const toast = useUI((s) => s.toast);
  const [query, setQuery] = useState('');
  const [notesFor, setNotesFor] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!projects) return [];
    const q = normalize(query.trim());
    if (!q) return projects;
    return projects.filter((p) =>
      normalize([p.name, p.notes, p.brief.objective, p.brief.message, p.brief.target, ...p.messages.map((m) => m.content)].join(' ')).includes(q)
    );
  }, [projects, query]);

  if (!projects) return null;

  const duplicate = async (p: Project) => {
    const now = Date.now();
    const copy: Project = { ...structuredClone(p), id: uid('pj_'), name: `${p.name} (copie)`, createdAt: now, updatedAt: now };
    await db.projects.put(copy);
    toast('Projet dupliqué', 'ok');
  };

  const remove = async (p: Project) => {
    await db.projects.delete(p.id);
    if (current?.id === p.id) await refresh();
    toast('Projet supprimé');
  };

  const doExport = async () => {
    const bundle = await exportAll();
    downloadText(`motionprompter-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(bundle, null, 2), 'application/json');
    toast('Sauvegarde exportée (sans la clé API)', 'ok');
  };

  const doImport = async (file: File) => {
    try {
      const res = await importAll(JSON.parse(await file.text()));
      await refresh();
      toast(`Import réussi : ${res.projects} projet(s), ${res.styles} style(s)`, 'ok');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Fichier illisible', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="glass flex min-w-[14rem] flex-1 items-center gap-2 rounded-2xl px-3">
          <Icon name="search" className="h-4 w-4 text-muted" />
          <input
            className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted/70"
            placeholder="Rechercher dans les projets…"
            aria-label="Rechercher dans les projets"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={async () => {
            await create();
            setTab('atelier');
          }}
        >
          <Icon name="plus" className="h-4 w-4" /> Nouveau projet
        </button>
        <button type="button" className="btn-ghost" onClick={doExport}>
          Exporter tout (JSON)
        </button>
        <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>
          Importer
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void doImport(f);
            e.target.value = '';
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={query ? 'Aucun résultat' : 'Aucun projet'} text={query ? 'Essaie un autre mot-clé.' : 'Crée un projet pour commencer un brief dans l’Atelier.'} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((p) => {
            const progress = Math.round(briefProgress(p.brief) * 100);
            const isCurrent = current?.id === p.id;
            return (
              <li key={p.id} className={cx('card space-y-3', isCurrent && 'ring-2 ring-accent/40')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{p.name}</p>
                    <p className="text-xs text-muted">
                      Modifié {formatDate(p.updatedAt)} · {p.messages.length} message(s) · {p.versions.length} version(s)
                    </p>
                  </div>
                  {isCurrent && <span className="chip chip-active shrink-0">Ouvert</span>}
                </div>
                {p.brief.message && <p className="line-clamp-2 text-sm">« {p.brief.message} »</p>}
                <div className="h-1 overflow-hidden rounded-full bg-line/10" aria-label={`Brief complété à ${progress} %`}>
                  <div className="h-full gradient-bg" style={{ width: `${progress}%` }} />
                </div>
                {notesFor === p.id ? (
                  <NotesEditor project={p} onClose={() => setNotesFor(null)} />
                ) : (
                  p.notes && <p className="whitespace-pre-wrap rounded-xl bg-line/5 p-2 text-xs text-muted">{p.notes}</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    className="btn-primary btn-sm"
                    onClick={async () => {
                      await open(p.id);
                      setTab('atelier');
                    }}
                  >
                    Ouvrir
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={async () => {
                      await open(p.id);
                      setTab('generate');
                    }}
                  >
                    Prompts
                  </button>
                  <button type="button" className="btn-ghost btn-sm" onClick={() => setNotesFor(notesFor === p.id ? null : p.id)}>
                    Notes
                  </button>
                  <button type="button" className="btn-ghost btn-sm" onClick={() => duplicate(p)}>
                    Dupliquer
                  </button>
                  <ConfirmButton onConfirm={() => remove(p)}>Supprimer</ConfirmButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function NotesEditor({ project, onClose }: { project: Project; onClose: () => void }) {
  const [text, setText] = useState(project.notes);
  const current = useProject((s) => s.project);
  const patch = useProject((s) => s.patch);
  const save = async () => {
    if (current?.id === project.id) await patch((p) => ({ ...p, notes: text }));
    else await db.projects.put({ ...project, notes: text, updatedAt: Date.now() });
    onClose();
  };
  return (
    <div className="space-y-2">
      <textarea className="input" rows={4} aria-label="Notes du projet" value={text} onChange={(e) => setText(e.target.value)} placeholder="Idées, retours client, liens…" />
      <div className="flex gap-2">
        <button type="button" className="btn-primary btn-sm" onClick={save}>
          Enregistrer
        </button>
        <button type="button" className="btn-ghost btn-sm" onClick={onClose}>
          Annuler
        </button>
      </div>
    </div>
  );
}

function SettingsPanel() {
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  const refresh = useProject((s) => s.refresh);
  const ensure = useProject((s) => s.ensure);
  const toast = useUI((s) => s.toast);
  const [showKey, setShowKey] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);
  const isPreset = CLAUDE_MODELS.some((m) => m.id === settings.claudeModel);

  const fetchModels = async () => {
    setLoadingModels(true);
    setOllamaStatus(null);
    try {
      const list = await listOllamaModels(settings.ollamaUrl);
      setModels(list);
      setOllamaStatus(
        list.length
          ? { tone: 'ok', text: `${list.length} modèle(s) trouvé(s).` }
          : { tone: 'error', text: 'Ollama répond mais aucun modèle n’est installé. Lance par exemple « ollama pull llama3.1 ».' }
      );
      if (list.length && !list.includes(settings.ollamaModel)) await update({ ollamaModel: list[0] ?? '' });
    } catch (e) {
      setOllamaStatus({ tone: 'error', text: toProviderError(e).message });
    } finally {
      setLoadingModels(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="card space-y-4" aria-labelledby="engine-title">
        <h2 id="engine-title" className="font-bold">
          Moteur IA
        </h2>
        <Segmented<ProviderMode>
          label="Moteur IA"
          value={settings.provider}
          onChange={(v) => update({ provider: v })}
          options={[
            { value: 'claude', label: 'Claude (API)' },
            { value: 'ollama', label: 'Ollama (local)' },
            { value: 'offline', label: 'Hors ligne' }
          ]}
        />
        <p className="text-xs text-muted">Aucune donnée n’est envoyée ailleurs que vers le moteur choisi. En mode hors ligne, rien ne quitte l’appareil.</p>

        {settings.provider === 'claude' && (
          <div className="space-y-4">
            <Notice tone="info">
              🔒 <strong>La clé reste sur cet appareil.</strong> Elle est stockée localement (IndexedDB) et envoyée uniquement à api.anthropic.com. Elle n’est jamais incluse dans les exports.
            </Notice>
            <Field label="Clé API Anthropic" htmlFor="claude-key" hint="Crée une clé sur console.anthropic.com (rubrique API Keys).">
              <div className="flex gap-2">
                <input
                  id="claude-key"
                  className="input font-mono"
                  type={showKey ? 'text' : 'password'}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="sk-ant-…"
                  value={settings.claudeApiKey}
                  onChange={(e) => update({ claudeApiKey: e.target.value.trim() })}
                />
                <button type="button" className="btn-ghost btn-sm shrink-0" onClick={() => setShowKey((v) => !v)}>
                  {showKey ? 'Masquer' : 'Afficher'}
                </button>
              </div>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Modèle" htmlFor="claude-model-select">
                <select
                  id="claude-model-select"
                  className="input"
                  value={isPreset ? settings.claudeModel : '__custom'}
                  onChange={(e) => update({ claudeModel: e.target.value === '__custom' ? '' : e.target.value })}
                >
                  {CLAUDE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                  <option value="__custom">Autre (saisie libre)…</option>
                </select>
              </Field>
              <TextField label="Identifiant du modèle" value={settings.claudeModel} onChange={(v) => update({ claudeModel: v.trim() })} hint={`Par défaut : ${DEFAULT_CLAUDE_MODEL}`} />
            </div>
          </div>
        )}

        {settings.provider === 'ollama' && (
          <div className="space-y-4">
            <TextField
              label="URL du serveur Ollama"
              value={settings.ollamaUrl}
              onChange={(v) => update({ ollamaUrl: v })}
              hint="Sur ce Mac : http://localhost:11434 · Depuis le téléphone : http://IP-DU-MAC:11434 (voir README pour OLLAMA_ORIGINS)."
            />
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[12rem] flex-1">
                <Field label="Modèle" htmlFor="ollama-model">
                  {models.length > 0 ? (
                    <select id="ollama-model" className="input" value={settings.ollamaModel} onChange={(e) => update({ ollamaModel: e.target.value })}>
                      {models.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input id="ollama-model" className="input" value={settings.ollamaModel} placeholder="ex. llama3.1:8b" onChange={(e) => update({ ollamaModel: e.target.value.trim() })} />
                  )}
                </Field>
              </div>
              <button type="button" className="btn-ghost" onClick={fetchModels} disabled={loadingModels}>
                {loadingModels ? 'Recherche…' : 'Actualiser la liste'}
              </button>
            </div>
            {ollamaStatus && <Notice tone={ollamaStatus.tone === 'ok' ? 'ok' : 'error'}>{ollamaStatus.text}</Notice>}
          </div>
        )}

        {settings.provider === 'offline' && (
          <Notice tone="info">
            Mode hors ligne : Apprendre, Styles et Projets fonctionnent normalement. L’Atelier pose les questions du brief sans IA et Générer produit le prompt par gabarit.
          </Notice>
        )}

        {settings.provider !== 'offline' && (
          <Field label="Longueur maximale de réponse (tokens)" htmlFor="max-tokens" hint="8 000 suffit pour un prompt final détaillé. Augmente si le prompt est coupé.">
            <input
              id="max-tokens"
              type="number"
              min={1000}
              max={32000}
              step={500}
              className="input w-40"
              value={settings.maxOutputTokens}
              onChange={(e) => update({ maxOutputTokens: Math.max(1000, Math.min(32000, parseInt(e.target.value, 10) || 8000)) })}
            />
          </Field>
        )}
      </section>

      <section className="card space-y-4" aria-labelledby="appearance-title">
        <h2 id="appearance-title" className="font-bold">
          Apparence
        </h2>
        <Field label="Thème">
          <Segmented<ThemeMode>
            label="Thème"
            value={settings.theme}
            onChange={(v) => update({ theme: v })}
            options={[
              { value: 'light', label: 'Clair' },
              { value: 'dark', label: 'Sombre' },
              { value: 'system', label: 'Système' }
            ]}
          />
        </Field>
        <Field label="Taille du texte">
          <Segmented<TextSize>
            label="Taille du texte"
            value={settings.textSize}
            onChange={(v) => update({ textSize: v })}
            options={[
              { value: 'sm', label: 'Petite' },
              { value: 'md', label: 'Normale' },
              { value: 'lg', label: 'Grande' }
            ]}
          />
        </Field>
      </section>

      <section className="card space-y-3" aria-labelledby="data-title">
        <h2 id="data-title" className="font-bold">
          Données
        </h2>
        <p className="text-sm text-muted">Projets, styles, favoris, progression du quiz et réglages sont stockés uniquement dans ce navigateur (IndexedDB). Pense à exporter une sauvegarde depuis l’onglet Projets.</p>
        <ConfirmButton
          confirmLabel="Tout effacer définitivement ?"
          onConfirm={async () => {
            await clearAllData();
            await useSettings.getState().reset();
            useProject.setState({ project: null });
            await ensure();
            await refresh();
            toast('Toutes les données ont été effacées', 'ok');
          }}
        >
          Vider toutes les données
        </ConfirmButton>
      </section>
    </div>
  );
}
