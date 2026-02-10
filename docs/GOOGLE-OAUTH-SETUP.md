# Google OAuth setup

To enable "Sign in with Google" you need credentials in Google Cloud and env vars in the backend.

## 0. OAuth consent screen: show "Noted" instead of Railway URL

Google shows the **redirect_uri domain** on the consent screen (e.g. "Vas a volver a iniciar sesión en mynotepad-production.up.railway.app"). To show your app name/domain instead:

1. **Application name**  
   In [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **OAuth consent screen** → set **Application name** to **Noted** (and Support email, Developer contact). Google may still show the redirect domain unless you use option 2.

2. **Show app domain on consent (recommended)**  
   Set in your backend (e.g. Railway) the env var **`OAUTH_CONSENT_SHOW_APP_DOMAIN=true`**. Then the backend sends your **frontend** URL as `redirect_uri` to Google, so the consent screen shows your app domain (e.g. `noted.vercel.app` or your custom domain) instead of the Railway backend URL.  
   When using this, in Google Console **Authorized redirect URIs** you must add your **frontend** callback URLs (see section 1 below). The authorization code is then sent to the frontend; the frontend immediately calls the backend to exchange it (no code is shown to the user).

## 1. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. **Create Credentials** → **OAuth client ID** (or edit your existing Web client).
3. Application type: **Web application**.
4. **Authorized JavaScript origins** (your frontend):
   - `http://localhost:5173`
   - `https://your-app.vercel.app` (or your production frontend URL, no trailing slash)
5. **Authorized redirect URIs** — depends on `OAUTH_CONSENT_SHOW_APP_DOMAIN`:
   - **If `OAUTH_CONSENT_SHOW_APP_DOMAIN=true`** (consent shows your app domain): add your **frontend** callback URLs:
     - `http://localhost:5173/auth/callback`
     - `https://your-app.vercel.app/auth/callback` (no trailing slash)
   - **If not set** (default, code only on backend): add your **backend** callback URLs:
     - Local: `http://localhost:3000/api/auth/google/callback`
     - Production: `https://YOUR-RAILWAY-URL/api/auth/google/callback` (no trailing slash)
6. Create and copy **Client ID** and **Client secret**.

## 2. Backend .env

In `backend/.env` add (do **not** commit the real values):

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
JWT_SECRET=your-long-random-string
FRONTEND_URL=http://localhost:5173
```

For production (Railway):

```env
FRONTEND_URL=https://your-app.vercel.app
BACKEND_URL=https://your-app.up.railway.app
# Optional: consent screen shows your app domain instead of Railway
OAUTH_CONSENT_SHOW_APP_DOMAIN=true
```

- **JWT_SECRET**: use a long random string (e.g. `openssl rand -base64 32`).
- **BACKEND_URL**: set in production so the OAuth callback URL sent to Google is correct when not using `OAUTH_CONSENT_SHOW_APP_DOMAIN`.
- **OAUTH_CONSENT_SHOW_APP_DOMAIN**: set to `true` so the Google consent screen shows your app domain (e.g. noted.vercel.app) instead of the Railway URL. When true, add your **frontend** `/auth/callback` URLs in Google Console Authorized redirect URIs.

## 3. Database

Run the users migration in Supabase **SQL Editor**:

- `my-notepad/supabase/migrations/003_users_google.sql`

This creates the `users` table used when someone signs in with Google.

## 4. Flow (best practice: code only on backend)

1. User clicks "Sign in with Google" on the landing page.
2. Frontend redirects to `BACKEND_URL/api/auth/google?redirect_uri=FRONTEND_ORIGIN/auth/callback`.
3. Backend redirects to Google with `redirect_uri=BACKEND_URL/api/auth/google/callback`; user signs in. The frontend URL is stored in `state`.
4. Google redirects to **backend** `BACKEND_URL/api/auth/google/callback?code=...&state=...`. The authorization code never touches the frontend.
5. Backend exchanges the code with Google (using the same backend callback URL), gets profile, upserts `users`, signs a JWT, and redirects the user to `FRONTEND_ORIGIN/auth/callback?token=JWT`.
6. Frontend `/auth/callback` receives `?token=...`, saves the token in `localStorage`, and redirects to `/app`. All API requests send `Authorization: Bearer <token>`.

## 5. Security

- Never commit `GOOGLE_CLIENT_SECRET` or `JWT_SECRET`.
- Keep `FRONTEND_URL` / `BACKEND_URL` in sync with your real URLs so redirect URIs are whitelisted correctly.

## 6. Error "redirect_uri_mismatch" (400)

If Google shows "Acceso bloqueado" / "redirect_uri_mismatch", the `redirect_uri` sent to Google does not match any **Authorized redirect URI** in your OAuth client.

- **If `OAUTH_CONSENT_SHOW_APP_DOMAIN=true`**: the app sends your **frontend** URL (e.g. `https://your-app.vercel.app/auth/callback`). Add that exact URL in Google Console → Authorized redirect URIs.
- **If not set**: the app sends your **backend** callback URL (e.g. `https://your-api.up.railway.app/api/auth/google/callback`). Add that exact URL. Ensure `BACKEND_URL` is set in Railway.
- Save and wait a minute; then try again.
