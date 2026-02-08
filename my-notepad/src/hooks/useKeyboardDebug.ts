import { useEffect } from 'react';
import type { PluginListenerHandle } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

const LOG = '[Keyboard Debug]';

/**
 * Debug keyboard on iOS:
 * 1. iPhone conectado por cable al Mac
 * 2. En iPhone: Ajustes > Safari > Avanzado > Activar "Inspector web"
 * 3. En Mac: Safari > Desarrollar > [tu iPhone] > [Noted / localhost]
 * 4. Toca el input "What needs to be done?" y mira la consola
 *
 * Si ves keyboardWillShow/keyboardDidShow con height > 0 → el teclado se dispara pero no se ve (problema de vista)
 * Si NO ves esos eventos al tocar el input → el teclado no se está pidiendo (problema de focus/WKWebView)
 */
export function useKeyboardDebug() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      console.log(LOG, 'Web – debug desactivado');
      return;
    }

    console.log(LOG, 'Plataforma:', Capacitor.getPlatform());
    console.log(LOG, 'Conecta Safari (Mac): Desarrollar > [iPhone] > [Noted]');

    const handles: PluginListenerHandle[] = [];

    Promise.all([
      Keyboard.addListener('keyboardWillShow', (info) => {
        console.log(LOG, 'keyboardWillShow – height:', info.keyboardHeight);
      }),
      Keyboard.addListener('keyboardDidShow', (info) => {
        console.log(LOG, 'keyboardDidShow – height:', info.keyboardHeight);
      }),
      Keyboard.addListener('keyboardWillHide', () => {
        console.log(LOG, 'keyboardWillHide');
      }),
      Keyboard.addListener('keyboardDidHide', () => {
        console.log(LOG, 'keyboardDidHide');
      }),
    ]).then((h) => handles.push(...h));

    Keyboard.getResizeMode()
      .then((r) => console.log(LOG, 'resize mode actual:', r.mode))
      .catch((e) => console.warn(LOG, 'getResizeMode:', e));

    return () => {
      handles.forEach((h) => h.remove());
      Keyboard.removeAllListeners();
    };
  }, []);
}
