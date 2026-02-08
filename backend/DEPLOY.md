# Deploy Backend to Railway or Render

## Subir el backend a Railway (paso a paso)

1. **Entra en Railway**: [railway.app](https://railway.app) → **Login** con GitHub.

2. **Nuevo proyecto**: **New Project** → **Deploy from GitHub repo**.
   - Conecta tu cuenta de GitHub si no lo has hecho.
   - Elige el repositorio del proyecto (ej. `myNotepadForNotesAndTodo`).
   - Railway crea un servicio; por defecto usa la raíz del repo.

3. **Carpeta del backend**: En el servicio desplegado:
   - **Settings** → **Root Directory** → escribe `backend` y guarda.
   - Así Railway usa solo la carpeta `backend` (package.json, build, start).

4. **Variables de entorno**: **Variables** (o **Settings** → **Variables**).
   Añade todas las que tienes en `backend/.env` (mismos nombres y valores):

   | Variable | Descripción |
   |----------|-------------|
   | `OPENAI_API_KEY` | Clave de OpenAI |
   | `BACKEND_API_KEY` | Mismo valor que `VITE_BACKEND_API_KEY` en el frontend |
   | `DEFAULT_USER_ID` | UUID (ej. el de tu .env local) |
   | `SUPABASE_URL` | `https://tu-proyecto.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | Service role key de Supabase |
   | `GOOGLE_CLIENT_ID` | Client ID de Google OAuth |
   | `GOOGLE_CLIENT_SECRET` | Client secret de Google OAuth |
   | `JWT_SECRET` | String aleatorio largo para firmar JWTs |
   | `FRONTEND_URL` | URL del frontend en producción (ej. `https://tu-app.vercel.app`) |
   | `BACKEND_URL` | **Ponla después del primer deploy**: URL que te da Railway (ej. `https://xxx.up.railway.app`) |

   `PORT` lo asigna Railway; no hace falta ponerla.

5. **Deploy**: Railway hace **Build** (`npm install && npm run build`) y **Start** (`npm start`) automáticamente.
   Si falla el build, revisa que en **Root Directory** esté `backend`.

6. **URL pública**: En **Settings** → **Networking** → **Generate Domain** (o **Public Networking**).
   Te dará una URL tipo `https://tu-servicio.up.railway.app`. **Cópiala**.

7. **BACKEND_URL en Railway**: Vuelve a **Variables** y añade o edita:
   - `BACKEND_URL` = la URL que copiaste (ej. `https://tu-servicio.up.railway.app`).
   Así el login con Google usará la URL correcta en el callback.

8. **Google Cloud Console**: En tu cliente OAuth 2.0, en **Authorized redirect URIs** añade:
   - `https://TU-URL-RAILWAY/api/auth/google/callback`
   (la misma URL que `BACKEND_URL` + `/api/auth/google/callback`).

9. **Frontend**: En Vercel (o donde tengas el front) pon:
   - `VITE_BACKEND_URL` = la URL de Railway (ej. `https://tu-servicio.up.railway.app`).
   - `VITE_BACKEND_API_KEY` = el mismo valor que `BACKEND_API_KEY`.
   Redespliega el frontend para que cargue la nueva URL.

10. **Comprobar**: Abre `https://tu-url-railway.app/health` en el navegador.
    Deberías ver: `{"status":"ok","service":"my-notepad-backend"}`.

---

## Quick Start: Railway (English)

1. **Sign up**: [railway.app](https://railway.app) → Sign in with GitHub
2. **New Project** → **Deploy from GitHub repo**
   - Select your repo
   - Set **Root Directory** = `backend` in Settings
3. **Add Environment Variables** (Settings → Variables): see table above (OPENAI_API_KEY, BACKEND_API_KEY, DEFAULT_USER_ID, SUPABASE_*, GOOGLE_*, JWT_SECRET, FRONTEND_URL, and after first deploy BACKEND_URL)
4. **Deploy**: Railway runs `npm install`, `npm run build`, `npm start` automatically
5. **Get URL**: Generate domain in Settings → Networking; copy it and set `BACKEND_URL` in Variables
6. **Use in frontend**: Set `VITE_BACKEND_URL` to your Railway URL

---

## Quick Start: Render

1. **Sign up**: [render.com](https://render.com) → Sign in with GitHub
2. **New** → **Web Service** → connect your repo
3. **Settings**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node (auto-detected)
4. **Environment Variables** (same as Railway above)
5. **Deploy**: Render builds and starts your service
6. **Get URL**: `https://my-notepad-backend.onrender.com` → copy this
7. **Use in frontend**: Set `VITE_BACKEND_URL=https://my-notepad-backend.onrender.com` in Vercel

---

## Environment Variables Checklist

Copy these from your `backend/.env`:

- ✅ `OPENAI_API_KEY` - from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- ✅ `BACKEND_API_KEY` - any secret string (same value as `VITE_BACKEND_API_KEY` in frontend)
- ✅ `DEFAULT_USER_ID` - UUID (generate at [uuidgenerator.net](https://www.uuidgenerator.net/))
- ✅ `SUPABASE_URL` - `https://YOUR_PROJECT.supabase.co` (use `.co`, not `.com`)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - from Supabase Dashboard → Settings → API → `service_role` (secret key)

**Note**: `PORT` is usually set automatically by Railway/Render, but you can set `PORT=3000` as fallback.

---

## After Deployment

1. **Test**: Visit `https://your-backend-url/health` → should return `{"status":"ok","service":"my-notepad-backend"}`
2. **Update Frontend**: In Vercel (or your frontend host), set `VITE_BACKEND_URL` to your backend URL
3. **Restart Frontend**: Redeploy frontend so it picks up the new `VITE_BACKEND_URL`

---

## Troubleshooting

- **Build fails**: Check that `backend/package.json` has `"build": "tsc"` and `"start": "node dist/index.js"`
- **503 errors**: Check Supabase URL/key are correct (use `.co` not `.com`)
- **401 errors**: Check `BACKEND_API_KEY` matches between backend and frontend
- **Port already in use**: Railway/Render set `PORT` automatically; don't hardcode it
