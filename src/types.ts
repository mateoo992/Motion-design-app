// Types partagés de l'application.

export type Aspect = '9:16' | '4:5' | '1:1' | '16:9';
export const ASPECTS: Aspect[] = ['9:16', '4:5', '1:1', '16:9'];

export const ASPECT_DIMENSIONS: Record<Aspect, { w: number; h: number }> = {
  '9:16': { w: 1080, h: 1920 },
  '4:5': { w: 1080, h: 1350 },
  '1:1': { w: 1080, h: 1080 },
  '16:9': { w: 1920, h: 1080 }
};

export type TabId = 'learn' | 'atelier' | 'styles' | 'generate' | 'projects';

export type ProviderMode = 'claude' | 'ollama' | 'offline';
export type ThemeMode = 'light' | 'dark' | 'system';
export type TextSize = 'sm' | 'md' | 'lg';

export interface Settings {
  provider: ProviderMode;
  claudeApiKey: string;
  claudeModel: string;
  ollamaUrl: string;
  ollamaModel: string;
  theme: ThemeMode;
  textSize: TextSize;
  currentProjectId: string | null;
  maxOutputTokens: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StoredMessage extends ChatMessage {
  id: string;
  createdAt: number;
}

export interface Scene {
  id: string;
  start: number | null;
  end: number | null;
  text: string;
  effect: string;
  transition: string;
}

export type BriefTextField =
  | 'objective'
  | 'target'
  | 'platform'
  | 'duration'
  | 'message'
  | 'cta'
  | 'tone'
  | 'references';

export interface Brief {
  objective: string;
  target: string;
  platform: string;
  format: Aspect | '';
  duration: string;
  message: string;
  cta: string;
  tone: string;
  references: string;
  styleId: string | null;
  styleNotes: string;
  scenes: Scene[];
  onScreenTexts: string[];
}

export type BriefKey = keyof Brief;

export interface PromptVersion {
  id: string;
  createdAt: number;
  label: string;
  format: Aspect | '';
  content: string;
  source: 'ia' | 'gabarit' | 'manuel';
  /** Prompt final (7 sections) ou prompt de correction (retour de rendu). */
  kind?: 'final' | 'correction';
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  brief: Brief;
  lockedFields: BriefKey[];
  messages: StoredMessage[];
  versions: PromptVersion[];
  activeVersionId: string | null;
  notes: string;
  offlineStep: number;
}

export interface PaletteColor {
  name: string;
  hex: string;
}

export interface StyleTokens {
  id: string;
  name: string;
  description: string;
  builtin: boolean;
  palette: PaletteColor[];
  gradient: { stops: string[]; angle: number } | null;
  typography: { family: string; weight: number; letterSpacing: string; notes: string };
  signatureEffects: string[];
  transitions: string[];
  rhythm: { totalDuration: number; sceneDuration: string; wordInterval: number; notes: string };
  easing: string;
  formats: Aspect[];
  forbidden: string[];
  createdAt: number;
  updatedAt: number;
}

export interface QuizCard {
  termId: string;
  box: number;
  due: number;
  seen: number;
  correct: number;
}

export interface Favorite {
  termId: string;
  createdAt: number;
}

export interface ExportBundle {
  app: 'MotionPrompter';
  version: 1;
  exportedAt: string;
  projects: Project[];
  styles: StyleTokens[];
  favorites: Favorite[];
  quiz: QuizCard[];
  settings: Omit<Settings, 'claudeApiKey'>;
}
