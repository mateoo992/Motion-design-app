import { create } from 'zustand';
import { db } from '../db/db';
import { emptyBrief } from '../lib/brief';
import { TEMPLATE_1_ID } from '../lib/defaultStyle';
import { uid } from '../lib/utils';
import type { Project } from '../types';
import { useSettings } from './settings';

interface ProjectState {
  project: Project | null;
  loading: boolean;
  /** Charge le projet courant (ou en crée un s'il n'y en a aucun). */
  ensure: () => Promise<Project>;
  open: (id: string) => Promise<void>;
  create: (name?: string) => Promise<Project>;
  /** Modifie le projet courant et le persiste. */
  patch: (fn: (p: Project) => Project) => Promise<void>;
  /** Recharge depuis la base (après import, suppression…). */
  refresh: () => Promise<void>;
}

export function newProject(name = 'Nouveau projet'): Project {
  const now = Date.now();
  const brief = emptyBrief();
  brief.styleId = TEMPLATE_1_ID;
  return {
    id: uid('pj_'),
    name,
    createdAt: now,
    updatedAt: now,
    brief,
    lockedFields: [],
    messages: [],
    versions: [],
    activeVersionId: null,
    notes: '',
    offlineStep: 0
  };
}

export const useProject = create<ProjectState>((set, get) => ({
  project: null,
  loading: false,
  ensure: async () => {
    const current = get().project;
    if (current) return current;
    const id = useSettings.getState().settings.currentProjectId;
    let p = id ? await db.projects.get(id) : undefined;
    if (!p) {
      p = (await db.projects.orderBy('updatedAt').last()) ?? undefined;
    }
    if (!p) {
      p = newProject();
      await db.projects.put(p);
    }
    set({ project: p });
    if (p.id !== id) await useSettings.getState().update({ currentProjectId: p.id });
    return p;
  },
  open: async (id) => {
    const p = await db.projects.get(id);
    if (!p) return;
    set({ project: p });
    await useSettings.getState().update({ currentProjectId: id });
  },
  create: async (name) => {
    const p = newProject(name);
    await db.projects.put(p);
    set({ project: p });
    await useSettings.getState().update({ currentProjectId: p.id });
    return p;
  },
  patch: async (fn) => {
    const cur = get().project;
    if (!cur) return;
    const next = { ...fn(cur), updatedAt: Date.now() };
    set({ project: next });
    await db.projects.put(next);
  },
  refresh: async () => {
    const cur = get().project;
    if (!cur) return;
    const fresh = await db.projects.get(cur.id);
    set({ project: fresh ?? null });
    if (!fresh) await get().ensure();
  }
}));
