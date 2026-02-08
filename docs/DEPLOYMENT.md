# Despliegue en la nube

- **Frontend**: Vercel (ideal para Vite + React).
- **Backend**: Railway o Render (mejor que Vercel para una app Express con Supabase/OpenAI).

---

## 1. Backend (Railway o Render)

Despliega primero el backend y obtén la URL pública (ej. `https://my-notepad-api.up.railway.app`).

### Opción A: Railway

1. [railway.app](https://railway.app) → Sign in with GitHub.
2. **New Project** → **Deploy from GitHub repo** → elige el repo y la carpeta **`backend`** (o el repo raíz y en Settings pon **Root Directory** = `backend`).
3. En **Variables** añade todas las de tu `backend/.env`:
   - `OPENAI_API_KEY`
   - `PORT` (Railway lo rellena; puedes dejar 3000 como fallback)
   - `BACKEND_API_KEY` (el mismo valor que usarás en el front como `VITE_BACKEND_API_KEY`)
   - `DEFAULT_USER_ID`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Railway asigna una URL pública. Cópiala (ej. `https://xxx.up.railway.app`). Es tu **URL del backend**.

**Build/start**: Railway detecta Node, ejecuta `npm install`, `npm run build` y `npm start` (usa `PORT` automáticamente).

### Opción B: Render

1. [render.com](https://render.com) → Sign in with GitHub.
2. **New** → **Web Service** → conecta el repo.
3. **Root Directory**: `backend`.
4. **Build Command**: `npm install && npm run build`
5. **Start Command**: `npm start`
6. **Environment**: añade las mismas variables que en Railway (incluida `PORT` si quieres; Render inyecta `PORT`).
7. Crea el servicio y copia la URL (ej. `https://my-notepad-backend.onrender.com`). Es tu **URL del backend**.

---

## 2. Frontend en Vercel

1. [vercel.com](https://vercel.com) → Sign in with GitHub.
2. **Add New** → **Project** → importa el mismo repo.
3. **Root Directory**: `my-notepad` (carpeta del frontend).
4. **Build Command**: `npm run build` (por defecto).
5. **Output Directory**: `dist` (Vite genera `dist` por defecto; Vercel suele detectarlo).
6. **Environment Variables**:
   - `VITE_BACKEND_URL` = URL del backend (ej. `https://xxx.up.railway.app` o `https://my-notepad-backend.onrender.com`)
   - `VITE_BACKEND_API_KEY` = el mismo valor que `BACKEND_API_KEY` en el backend
7. Deploy. Vercel te dará una URL (ej. `https://my-notepad.vercel.app`).

El front en producción usará `VITE_BACKEND_URL` para llamar al API; no hace falta tocar código si ya usas `import.meta.env.VITE_BACKEND_URL`.

---

## 3. CORS

El backend usa `app.use(cors())` (acepta cualquier origen). En producción puedes restringir:

- En el backend (Railway/Render), opcional: variable `ALLOWED_ORIGIN` = `https://my-notepad.vercel.app` y en código usar `cors({ origin: process.env.ALLOWED_ORIGIN })`. Si no la configuras, dejar `cors()` sin opciones sigue funcionando.

---

## 4. Resumen

| Parte     | Servicio   | URL que obtienes                          |
|----------|------------|-------------------------------------------|
| Backend  | Railway o Render | `https://...` (la usas en `VITE_BACKEND_URL`) |
| Frontend | Vercel     | `https://tu-proyecto.vercel.app`          |

- Despliega **primero el backend**, copia su URL y ponla en `VITE_BACKEND_URL` del front en Vercel.
- Las variables sensibles (`BACKEND_API_KEY`, Supabase, OpenAI) solo en el backend; en el front solo `VITE_BACKEND_URL` y `VITE_BACKEND_API_KEY`.

---

## 5. ¿Por qué no el backend en Vercel?

Vercel está pensado para sitios estáticos y **funciones serverless** (una petición = una función). Tu backend es una **app Express** que escucha en un puerto; en Vercel tendrías que adaptarlo a una sola función serverless, con límites de tiempo (timeout) y cold starts. Para una API Express con Supabase y OpenAI, **Railway o Render** son más simples y predecibles.
