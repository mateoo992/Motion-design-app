import type { ChatMessage } from '../types';
import { fitToContext } from './context';
import { ProviderError, toProviderError, type GenerateOptions, type GenerateResult, type Provider } from './types';

const ENDPOINT = 'https://api.anthropic.com/v1/messages';
/** Budget d'entrée prudent (les modèles Claude acceptent bien plus, mais on reste raisonnable en coût). */
const INPUT_BUDGET = 120_000;

interface ClaudeConfig {
  apiKey: string;
  model: string;
}

async function readError(res: Response): Promise<ProviderError> {
  let detail = '';
  try {
    const body = (await res.json()) as { error?: { type?: string; message?: string } };
    detail = body.error?.message ?? '';
  } catch {
    /* corps non JSON */
  }
  const low = detail.toLowerCase();
  if (res.status === 401 || res.status === 403)
    return new ProviderError('auth', 'Clé API refusée par Anthropic. Vérifie-la dans Réglages.');
  if (res.status === 404) return new ProviderError('bad_request', `Modèle introuvable : vérifie son identifiant dans Réglages. ${detail}`);
  if (res.status === 429) return new ProviderError('rate_limit', 'Limite de requêtes atteinte. Patiente quelques secondes puis réessaie.');
  if (res.status === 529 || res.status === 503) return new ProviderError('overloaded', 'Les serveurs de Claude sont surchargés. Réessaie dans un instant.');
  if (res.status === 413 || low.includes('too long') || low.includes('context') || low.includes('maximum'))
    return new ProviderError('context', 'La conversation est trop longue pour le modèle. Démarre un nouveau projet ou raccourcis ton message.');
  if (res.status === 400) return new ProviderError('bad_request', `Requête refusée : ${detail || 'paramètres invalides'}.`);
  return new ProviderError('unknown', `Erreur ${res.status} : ${detail || res.statusText}`);
}

export function createClaudeProvider(cfg: ClaudeConfig): Provider {
  return {
    id: 'claude',
    label: 'Claude (Anthropic)',
    async generate(messages: ChatMessage[], options: GenerateOptions): Promise<GenerateResult> {
      if (!cfg.apiKey.trim()) throw new ProviderError('missing_key', 'Aucune clé API Claude. Ajoute-la dans Réglages.');
      if (!cfg.model.trim()) throw new ProviderError('missing_model', 'Aucun modèle Claude choisi dans Réglages.');
      const system = options.system ?? '';
      const fitted = fitToContext(messages, system, INPUT_BUDGET);
      let res: Response;
      try {
        res = await fetch(ENDPOINT, {
          method: 'POST',
          signal: options.signal,
          headers: {
            'content-type': 'application/json',
            'x-api-key': cfg.apiKey.trim(),
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model: cfg.model.trim(),
            max_tokens: options.maxTokens ?? 4096,
            ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
            system,
            stream: true,
            messages: fitted.messages
          })
        });
      } catch (e) {
        throw toProviderError(e);
      }
      if (!res.ok || !res.body) throw await readError(res);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let full = '';
      let truncated = false;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let sep: number;
          while ((sep = buffer.indexOf('\n\n')) !== -1) {
            const rawEvent = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            const dataLine = rawEvent
              .split('\n')
              .filter((l) => l.startsWith('data:'))
              .map((l) => l.slice(5).trim())
              .join('');
            if (!dataLine) continue;
            let evt: {
              type?: string;
              delta?: { type?: string; text?: string; stop_reason?: string };
              error?: { type?: string; message?: string };
            };
            try {
              evt = JSON.parse(dataLine);
            } catch {
              continue;
            }
            if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta' && evt.delta.text) {
              full += evt.delta.text;
              options.onToken?.(evt.delta.text, full);
            } else if (evt.type === 'message_delta' && evt.delta?.stop_reason === 'max_tokens') {
              truncated = true;
            } else if (evt.type === 'error') {
              const t = evt.error?.type ?? '';
              if (t === 'overloaded_error') throw new ProviderError('overloaded', 'Claude est surchargé. Réessaie dans un instant.');
              throw new ProviderError('unknown', evt.error?.message ?? 'Erreur pendant le streaming.');
            }
          }
        }
      } catch (e) {
        try {
          await reader.cancel();
        } catch {
          /* déjà fermé */
        }
        throw toProviderError(e);
      }
      return { text: full, trimmed: fitted.trimmed, truncated };
    }
  };
}
