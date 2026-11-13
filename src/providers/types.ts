import type { ChatMessage } from '../types';

export interface GenerateOptions {
  /** Prompt système. */
  system?: string;
  /** Reçoit chaque fragment de texte au fil du streaming. */
  onToken?: (chunk: string, full: string) => void;
  /** Permet d'annuler la génération en cours. */
  signal?: AbortSignal;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerateResult {
  text: string;
  /** Vrai si l'historique a été raccourci pour tenir dans la fenêtre de contexte. */
  trimmed: boolean;
  /** Vrai si la réponse a été coupée par la limite de tokens de sortie. */
  truncated: boolean;
}

export interface Provider {
  id: 'claude' | 'ollama' | 'offline';
  label: string;
  generate(messages: ChatMessage[], options: GenerateOptions): Promise<GenerateResult>;
}

export type ProviderErrorCode =
  | 'missing_key'
  | 'missing_model'
  | 'auth'
  | 'network'
  | 'aborted'
  | 'context'
  | 'rate_limit'
  | 'overloaded'
  | 'bad_request'
  | 'offline'
  | 'unknown';

export class ProviderError extends Error {
  code: ProviderErrorCode;
  constructor(code: ProviderErrorCode, message: string) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
  }
}

export function toProviderError(e: unknown): ProviderError {
  if (e instanceof ProviderError) return e;
  if (e instanceof DOMException && e.name === 'AbortError') {
    return new ProviderError('aborted', 'Génération annulée.');
  }
  if (e instanceof TypeError) {
    return new ProviderError(
      'network',
      'Connexion impossible. Vérifie ta connexion Internet (ou que le serveur Ollama tourne et accepte cette origine).'
    );
  }
  return new ProviderError('unknown', e instanceof Error ? e.message : 'Erreur inconnue.');
}
