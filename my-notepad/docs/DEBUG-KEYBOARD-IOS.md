# Debug keyboard on iOS

When the keyboard does not appear after tapping the input on iPhone, you can see what’s happening using Safari on your Mac.

---

# Depurar teclado en iOS

Cuando el teclado no aparece al tocar el input en el iPhone, puedes ver qué está pasando con Safari (Mac).

## Pasos

1. **Conectar el iPhone al Mac** con el cable USB.

2. **En el iPhone**
   - Ajustes → Safari → Avanzado
   - Activar **"Inspector web"** (o "Web Inspector").

3. **En el Mac**
   - Abre **Safari** (no Chrome).
   - Menú **Desarrollar** (si no lo ves: Safari → Preferencias → Avanzado → "Mostrar menú Desarrollar").
   - Desarrollar → **[nombre de tu iPhone]** → elige la URL de tu app (ej. **My Notepad** o **localhost**).
   - Se abre la ventana del **Inspector web** con la pestaña **Consola**.

4. **En el iPhone**
   - Abre la app My Notepad.
   - Toca el campo **"What needs to be done?"**.

5. **En la Consola (Mac)** busca mensajes que empiecen por `[Keyboard Debug]`:

   - **"Todo input focused"** → el input recibe el foco.
   - **"keyboardWillShow – height: 336"** (u otro número) → iOS está mostrando el teclado y reporta altura. Si el número es > 0 pero no ves el teclado, el problema es de vista/layout.
   - **"keyboardDidShow – height: 336"** → el teclado ya está “mostrado” según iOS.
   - Si **no** aparecen `keyboardWillShow` ni `keyboardDidShow` al tocar el input → el teclado no se está pidiendo (problema de WKWebView/focus).

## Cómo interpretar

| Lo que ves en consola | Significado |
|------------------------|-------------|
| No hay "Todo input focused" | El `onFocus` del input no se dispara al tocar. |
| "Todo input focused" pero no hay keyboardWillShow/keyboardDidShow | El input tiene foco pero iOS no está mostrando el teclado (limitación/bug de WKWebView). |
| keyboardWillShow/keyboardDidShow con **height: 0** | iOS notifica teclado pero con altura 0 (bug o configuración rara). |
| keyboardWillShow/keyboardDidShow con **height > 0** | El teclado se está “mostrando” según iOS; si no lo ves, algo lo tapa o está fuera de pantalla. |

## Build para probar

Después de cambiar código:

```bash
npm run build:mobile
```

Luego abre de nuevo la app en el iPhone desde Xcode (o reinstala si hace falta).

---

## Quick steps (English)

1. Connect the iPhone to the Mac with a USB cable.
2. On iPhone: **Settings → Safari → Advanced** → turn on **Web Inspector**.
3. On Mac: open **Safari** → **Develop** (enable in Safari → Preferences → Advanced if needed) → **[Your iPhone]** → select **My Notepad** (or the app URL).
4. On iPhone: open the app and tap the **"What needs to be done?"** field.
5. In the Safari Web Inspector **Console** (on Mac), look for lines starting with `[Keyboard Debug]`:
   - **"Todo input focused"** = the input received focus.
   - **"keyboardWillShow – height: 336"** (or similar) = iOS is showing the keyboard. If you see a height &gt; 0 but still don’t see the keyboard on screen, the issue is view/layout.
   - If you see **keyboardWillHide** / **keyboardDidHide** right after focus, something (e.g. programmatic scroll) is dismissing the keyboard; the latest fix disables `scrollIntoView` on native to avoid that.
6. Rebuild and reinstall: `npm run build:mobile` then run from Xcode on the device.
