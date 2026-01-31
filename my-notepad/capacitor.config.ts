import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mynotepad.app',
  appName: 'My Notepad',
  webDir: 'dist',
  server: {
    // Allow live reload in dev when using cap run
    androidScheme: 'https',
  },
};

export default config;
