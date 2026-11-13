import type { ChatMessage } from '../types';
import { fitToContext } from './context';
import { ProviderError, toProviderError, type GenerateOptions, type GenerateResult, type Provider } from './types';

const NUM_CTX = 8192;

interface OllamaConfig {
  url: string;
  model: string;
}

export function normalizeOllamaUrl(url: string): string {
  return url.trim().replace(/\/+$/, '') || 'http://localhost:11434';
}

export async function listOllamaModels(url: string, signal?: AbortSignal): Promise<string[]> {
  let res: Response;
  try {
    res = await fetch(`${normalizeOllamaUrl(url)}/api/tags`, { signal });
  } catch (e) {
    const err = toProviderError(e);
    if (err.code === 'network')
      throw new ProviderError(
        'network',
        'Ollama injoignable. Vérifie qu’il tourne, que l’URL est bonne et que OLLAMA_ORIGINS autorise cette app (voir README).'
      );
    throw err;
  }
  if (!res.ok) throw new ProviderError('unknown', `Ollama a répondu ${res.status}.`);
  const body = (await res.json()) as { models?: Array<{ name?: string; model?: string }> };
  return (body.models ?? []).map((m) => m.name ?? m.model ?? '').filter(Boolean);
}

export function createOllamaProvider(cfg: OllamaConfig): Provider {
  return {
    id: 'ollama',
    label: 'Ollama (local)',
    async generate(messages: ChatMessage[], options: GenerateOptions): Promise<GenerateResult> {
      if (!cfg.model.trim()) throw new ProviderError('missing_model', 'Choisis un modèle Ollama dans Réglages (bouton « Actualiser la liste »).');
      const system = options.system ?? '';
      const budget = NUM_CTX - (options.maxTokens ?? 2048) - 256;
      const fitted = fitToContext(messages, system, Math.max(2048, budget));
      let res: Response;
      try {
        res = await fetch(`${normalizeOllamaUrl(cfg.url)}/api/chat`, {
          method: 'POST',
          signal: options.signal,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            model: cfg.model.trim(),
            stream: true,
            messages: [{ role: 'system', content: system }, ...fitted.messages],
            options: {
              num_ctx: NUM_CTX,
              num_predict: options.maxTokens ?? 2048,
              ...(options.temperature !== undefined ? { temperature: options.temperature } : {})
            }
          })
        });
      } catch (e) {
        const err = toProviderError(e);
        if (err.code === 'network')
          throw new ProviderError('network', 'Ollama injoignable. Lance « ollama serve » et vérifie OLLAMA_ORIGINS (voir README).');
        throw err;
      }
      if (!res.ok || !res.body) {
        let detail = '';
        try {
          detail = ((await res.json()) as { error?: string }).error ?? '';
        } catch {
          /* ignore */
        }
        if (res.status === 404) throw new ProviderError('missing_model', `Modèle « ${cfg.model} » absent. Fais « ollama pull ${cfg.model} ».`);
        if (detail.toLowerCase().includes('context')) throw new ProviderError('context', 'Contexte trop long pour ce modèle local.');
        throw new ProviderError('unknown', `Ollama : ${detail || res.status}`);
      }
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
          let nl: number;
          while ((nl = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!line) continue;
            let evt: { message?: { content?: string }; done?: boolean; done_reason?: string; error?: string };
            try {
              evt = JSON.parse(line);
            } catch {
              continue;
            }
            if (evt.error) throw new ProviderError('unknown', `Ollama : ${evt.error}`);
            const chunk = evt.message?.content ?? '';
            if (chunk) {
              full += chunk;
              options.onToken?.(chunk, full);
            }
            if (evt.done && evt.done_reason === 'length') truncated = true;
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
