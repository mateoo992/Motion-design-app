import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.motionprompter.app',
  appName: 'MotionPrompter',
  webDir: 'dist',
  server: {
    // Autorise les appels HTTP en clair vers Ollama sur le réseau local.
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
