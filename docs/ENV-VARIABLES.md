# Variables de entorno

## Backend (`backend/.env` o Railway Variables)

| Variable | Obligatoria | Descripción | Ejemplo |
|----------|-------------|-------------|---------|
| `OPENAI_API_KEY` | ✅ Sí | Clave de API de OpenAI | `sk-proj-...` |
| `SUPABASE_URL` | ✅ Sí | URL del proyecto Supabase (usa `.co`) | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Sí | Service role key de Supabase (Dashboard → Settings → API) | `eyJhbGc...` |
| `BACKEND_API_KEY` | ✅ Sí | Clave secreta; el frontend la envía como `VITE_BACKEND_API_KEY` | Cualquier string largo |
| `DEFAULT_USER_ID` | ✅ Sí | UUID para datos con API key (sin Google) | `b1b5fc69-0f5d-446f-b9ab-6c91bfb995de` |
| `PORT` | No | Puerto del servidor (Railway la asigna) | `3000` |
| `GOOGLE_CLIENT_ID` | No* | Client ID de Google OAuth (Sign in with Google) | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | No* | Client secret de Google OAuth | `GOCSPX-...` |
| `JWT_SECRET` | No* | String aleatorio para firmar tokens de login | `openssl rand -base64 32` |
| `FRONTEND_URL` | No | Origen del frontend (para OAuth y CORS) | `http://localhost:5173` o `https://tu-app.vercel.app` |
| `BACKEND_URL` | No** | URL pública del backend (para callback de Google) | `https://tu-app.up.railway.app` |

\* Obligatorias si quieres "Sign in with Google".  
\** Obligatoria en producción si usas Google login (pon la URL que te da Railway).

---

## Frontend (`my-notepad/.env` o Vercel Environment Variables)

| Variable | Obligatoria | Descripción | Ejemplo |
|----------|-------------|-------------|---------|
| `VITE_BACKEND_URL` | ✅ Sí (si usas backend) | URL del backend | `http://localhost:3000` o `https://xxx.up.railway.app` |
| `VITE_BACKEND_API_KEY` | ✅ Sí (si usas backend) | Mismo valor que `BACKEND_API_KEY` del backend | Mismo string que en backend |

---

## Resumen rápido para Railway

Variables que debes poner en **Railway → Variables** (todas las del backend):

```
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
BACKEND_API_KEY=
DEFAULT_USER_ID=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
JWT_SECRET=
FRONTEND_URL=
BACKEND_URL=
```

`BACKEND_URL` ponla después del primer deploy (la URL que te da Railway).  
`PORT` no hace falta; Railway la asigna.

---

## Resumen rápido para el frontend (Vercel)

```
VITE_BACKEND_URL=https://tu-url-railway.up.railway.app
VITE_BACKEND_API_KEY=<mismo valor que BACKEND_API_KEY>
```
