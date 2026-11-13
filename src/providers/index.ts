import type { Settings } from '../types';
import { createClaudeProvider } from './claude';
import { createOllamaProvider } from './ollama';
import { offlineProvider } from './offline';
import type { Provider } from './types';

export * from './types';
export { listOllamaModels } from './ollama';

export function getProvider(s: Settings): Provider {
  switch (s.provider) {
    case 'claude':
      return createClaudeProvider({ apiKey: s.claudeApiKey, model: s.claudeModel });
    case 'ollama':
      return createOllamaProvider({ url: s.ollamaUrl, model: s.ollamaModel });
    default:
      return offlineProvider;
  }
}

export function providerReady(s: Settings): { ok: boolean; reason: string } {
  if (s.provider === 'offline') return { ok: false, reason: 'Mode hors ligne actif.' };
  if (s.provider === 'claude' && !s.claudeApiKey.trim()) return { ok: false, reason: 'Clé API Claude manquante.' };
  if (s.provider === 'ollama' && !s.ollamaModel.trim()) return { ok: false, reason: 'Aucun modèle Ollama sélectionné.' };
  return { ok: true, reason: '' };
}
