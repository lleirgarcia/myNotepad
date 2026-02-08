/**
 * Native app (iOS & Android) shell: show login when not authenticated, App when authenticated.
 * Used so the app never shows the landing page on iPhone/Android — only login or the main app.
 */
import { hasAuthToken } from '../lib/backend-api';
import App from '../App';
import LoginRegisterOnly from './LoginRegisterOnly';

export default function NativeAppShell() {
  if (hasAuthToken()) {
    return <App />;
  }
  return <LoginRegisterOnly />;
}
