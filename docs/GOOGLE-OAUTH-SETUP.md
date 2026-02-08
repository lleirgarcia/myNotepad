# Google OAuth setup

To enable "Sign in with Google" you need credentials in Google Cloud and env vars in the backend.

## 1. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. **Create Credentials** → **OAuth client ID**.
3. Application type: **Web application**.
4. **Authorized JavaScript origins** (your frontend):
   - `http://localhost:5173`
   - `https://your-app.vercel.app` (or your production frontend URL)
5. **Authorized redirect URIs** (your backend callback):
   - `http://localhost:3000/api/auth/google/callback`
   - `https://YOUR-RAILWAY-URL/api/auth/google/callback` (e.g. `https://my-notepad-api.up.railway.app/api/auth/google/callback`)
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

## 4. Flow

1. User clicks "Sign in with Google" on the landing page.
2. Frontend redirects to `BACKEND_URL/api/auth/google?redirect_uri=FRONTEND_URL/auth/callback`.
3. Backend redirects to Google; user signs in.
4. Google redirects to `BACKEND_URL/api/auth/google/callback?code=...`.
5. Backend exchanges `code` for tokens, gets user profile, upserts `users`, signs a JWT, redirects to `FRONTEND_URL/auth/callback?token=JWT`.
6. Frontend saves the token in `localStorage` and redirects to `/app`. All API requests send `Authorization: Bearer <token>`.

## 5. Security

- Never commit `GOOGLE_CLIENT_SECRET` or `JWT_SECRET`.
- Keep `FRONTEND_URL` / `BACKEND_URL` in sync with your real URLs so redirect URIs are whitelisted correctly.
