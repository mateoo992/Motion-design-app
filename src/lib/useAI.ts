import { useCallback, useRef, useState } from 'react';
import { getProvider, providerReady, toProviderError, type ProviderError } from '../providers';
import { useSettings } from '../store/settings';
import type { ChatMessage } from '../types';

export interface RunArgs {
  messages: ChatMessage[];
  system: string;
  maxTokens?: number;
  temperature?: number;
  onToken?: (full: string) => void;
}

export interface RunOutcome {
  text: string;
  trimmed: boolean;
  truncated: boolean;
  aborted: boolean;
}

/** Hook commun : lance une génération en streaming, gère l'annulation et les erreurs. */
export function useAI() {
  const settings = useSettings((s) => s.settings);
  const controllerRef = useRef<AbortController | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<ProviderError | null>(null);

  const ready = providerReady(settings);

  const run = useCallback(
    async (args: RunArgs): Promise<RunOutcome | null> => {
      controllerRef.current?.abort();
      const ctrl = new AbortController();
      controllerRef.current = ctrl;
      setStreaming(true);
      setError(null);
      let partial = '';
      try {
        const provider = getProvider(useSettings.getState().settings);
        const res = await provider.generate(args.messages, {
          system: args.system,
          signal: ctrl.signal,
          maxTokens: args.maxTokens ?? useSettings.getState().settings.maxOutputTokens,
          temperature: args.temperature,
          onToken: (_chunk, full) => {
            partial = full;
            args.onToken?.(full);
          }
        });
        return { ...res, aborted: false };
      } catch (e) {
        const err = toProviderError(e);
        if (err.code === 'aborted') return { text: partial, trimmed: false, truncated: false, aborted: true };
        setError(err);
        return null;
      } finally {
        if (controllerRef.current === ctrl) controllerRef.current = null;
        setStreaming(false);
      }
    },
    []
  );

  const stop = useCallback(() => controllerRef.current?.abort(), []);

  return { run, stop, streaming, error, setError, ready, settings };
}
