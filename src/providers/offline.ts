import { ProviderError, type Provider } from './types';

/** Mode hors ligne : aucune IA. Les écrans utilisent les gabarits locaux à la place. */
export const offlineProvider: Provider = {
  id: 'offline',
  label: 'Hors ligne (sans IA)',
  async generate() {
    throw new ProviderError('offline', 'Mode hors ligne : aucune IA n’est appelée. Utilise les gabarits ou active un moteur dans Réglages.');
  }
};
