import { create } from 'zustand';
import { db } from '../db/db';
import type { Settings } from '../types';

export const DEFAULT_CLAUDE_MODEL = 'claude-sonnet-5-5';

export const CLAUDE_MODELS: Array<{ id: string; label: string }> = [
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5 (recommandé)' },
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5 (plus puissant, plus cher)' },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5 (rapide, économique)' },
  { id: 'claude-fable-5-2', label: 'Claude Fable 5.2' }
];

export const DEFAULT_SETTINGS: Settings = {
  provider: 'offline',
  claudeApiKey: '',
  claudeModel: DEFAULT_CLAUDE_MODEL,
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: '',
  theme: 'light',
  textSize: 'md',
  currentProjectId: null,
  maxOutputTokens: 8000
};

interface SettingsState {
  settings: Settings;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
  reset: () => Promise<void>;
}

export function applyAppearance(s: Settings): void {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = s.theme === 'dark' || (s.theme === 'system' && prefersDark);
  root.classList.toggle('dark', dark);
  root.dataset.textSize = s.textSize;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#0b0b12' : '#f6f6f9');
}

export const useSettings = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  hydrated: false,
  hydrate: async () => {
    const row = await db.settings.get('app');
    const settings: Settings = { ...DEFAULT_SETTINGS, ...(row?.value ?? {}) };
    applyAppearance(settings);
    set({ settings, hydrated: true });
  },
  update: async (patch) => {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    applyAppearance(settings);
    await db.settings.put({ key: 'app', value: settings });
  },
  reset: async () => {
    set({ settings: DEFAULT_SETTINGS });
    applyAppearance(DEFAULT_SETTINGS);
    await db.settings.put({ key: 'app', value: DEFAULT_SETTINGS });
  }
}));
