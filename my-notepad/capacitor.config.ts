/// <reference types="@capacitor/keyboard" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mynotepad.app',
  appName: 'My Notepad',
  webDir: 'dist',
  server: {
    // Allow live reload in dev when using cap run
    androidScheme: 'https',
  },
  plugins: {
    Keyboard: {
      // iOS: 'native' = WebView redimensiona cuando aparece el teclado (evita que setResizeMode en focus dispare hide)
      resize: 'native',
      style: 'DARK',
    },
  },
};

export default config;
