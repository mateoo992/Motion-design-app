import type { ChatMessage } from '../types';
import { estimateTokens } from '../lib/utils';

/**
 * Garde les messages les plus récents qui tiennent dans le budget de tokens.
 * Le premier message utilisateur est conservé quand c'est possible (il porte souvent l'intention initiale).
 */
export function fitToContext(
  messages: ChatMessage[],
  system: string,
  budgetTokens: number
): { messages: ChatMessage[]; trimmed: boolean } {
  const sysCost = estimateTokens(system);
  let remaining = budgetTokens - sysCost;
  const kept: ChatMessage[] = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i] as ChatMessage;
    const cost = estimateTokens(m.content) + 8;
    if (cost > remaining) break;
    kept.unshift(m);
    remaining -= cost;
  }
  if (kept.length === 0 && messages.length > 0) {
    // Le dernier message seul est trop long : on le tronque par le début.
    const last = messages[messages.length - 1] as ChatMessage;
    const maxChars = Math.max(1000, Math.floor((budgetTokens - sysCost) * 3.5));
    kept.push({ role: last.role, content: last.content.slice(-maxChars) });
  }
  // L'API exige que la conversation commence par un message utilisateur.
  while (kept.length && kept[0]?.role !== 'user') kept.shift();
  const trimmed = kept.length < messages.length;
  if (trimmed) {
    const note: ChatMessage = {
      role: 'user',
      content: '(Note : le début de la conversation a été retiré pour tenir dans la mémoire du modèle. Appuie-toi sur le brief fourni.)'
    };
    if (kept[0]?.role === 'user') kept[0] = { role: 'user', content: `${note.content}\n\n${kept[0].content}` };
  }
  return { messages: kept, trimmed };
}
