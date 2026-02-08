# Google OAuth setup

To enable "Sign in with Google" you need credentials in Google Cloud and env vars in the backend.

**Why redirect to the backend?** The authorization code is sent by Google to the `redirect_uri`. If that URL is the frontend, the code appears in the browser (URL, history, referrer). Best practice is to use the **backend** as `redirect_uri`: Google sends the code only to the server, the backend exchanges it (with `client_secret`), then redirects the user to the frontend with the JWT. The frontend never sees the code.

## 1. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. **Create Credentials** → **OAuth client ID** (or edit your existing Web client).
3. Application type: **Web application**.
4. **Authorized JavaScript origins** (your frontend):
   - `http://localhost:5173`
   - `https://your-app.vercel.app` (or your production frontend URL, no trailing slash)
5. **Authorized redirect URIs** — must be your **backend** callback URL (Google redirects the user here with the code; the backend exchanges it and redirects to your frontend with the JWT). Add:
   - Local: `http://localhost:3000/api/auth/google/callback` (or the port your backend uses)
   - Production: `https://YOUR-RAILWAY-URL/api/auth/google/callback` (e.g. `https://my-notepad-api.up.railway.app/api/auth/google/callback`, no trailing slash)
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
```

- **JWT_SECRET**: use a long random string (e.g. `openssl rand -base64 32`).
- **BACKEND_URL**: set in production so the OAuth callback URL sent to Google is correct (Railway often hides the real host).

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

- The app sends your **backend** callback URL to Google (e.g. `http://localhost:3000/api/auth/google/callback` or `https://your-api.up.railway.app/api/auth/google/callback`).
- In Google Cloud Console → Credentials → your OAuth 2.0 Client ID → **Authorized redirect URIs**, add **exactly**:
  - Local: `http://localhost:3000/api/auth/google/callback` (same port as your backend, no trailing slash).
  - Production: `https://YOUR-RAILWAY-URL/api/auth/google/callback` (the public URL of your backend, no trailing slash).
- Ensure `BACKEND_URL` is set in production (Railway) so the backend builds the correct callback URL.
- Save and wait a minute; then try again.
