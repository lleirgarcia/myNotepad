# Why don’t I see data?

Check these in order.

---

## 1. Frontend env (my-notepad)

In **`my-notepad/.env`** you must have:

- **`VITE_BACKEND_URL`** – backend base URL (e.g. `http://localhost:3000` for local).
- **`VITE_BACKEND_API_KEY`** – same value as `BACKEND_API_KEY` in the backend.

If `VITE_BACKEND_URL` is missing or empty, the app **does not call the backend** and you only see local (empty) state. Restart the dev server after changing `.env`.

---

## 2. Backend running and env

- Backend must be running: `cd backend && npm run dev` (or your deployed URL).
- In **`backend/.env`** you must have:
  - **`BACKEND_API_KEY`** – same as `VITE_BACKEND_API_KEY` in the frontend.
  - **`DEFAULT_USER_ID`** – a UUID (e.g. from [uuidgenerator.net](https://www.uuidgenerator.net/)).
  - **`SUPABASE_URL`** – `https://YOUR_PROJECT.supabase.co` (use `.co`, not `.com`).
  - **`SUPABASE_SERVICE_ROLE_KEY`** – from Supabase Dashboard → Settings → API → `service_role` (secret).

Wrong or missing keys → 401 or 503 → frontend shows empty or errors.

---

## 3. Supabase tables and user_id

- In Supabase **SQL Editor**, run **`my-notepad/supabase/schema.sql`** (or the migrations) so that **todos**, **notes**, and **whiteboard** exist.
- All data is filtered by **`user_id`** = **`DEFAULT_USER_ID`** from the backend `.env`. If you inserted rows with a different `user_id` (e.g. from an old auth setup), they won’t show. Either:
  - Use the same `DEFAULT_USER_ID` that was used when inserting, or
  - Insert test rows with `user_id` = your current `DEFAULT_USER_ID`.

---

## 4. Quick checks

- **Browser DevTools → Network**: Do you see requests to `VITE_BACKEND_URL/api/todos` and `/api/whiteboard`?  
  - No requests → frontend not calling backend (check `VITE_BACKEND_URL` and restart dev server).  
  - 401 → wrong or missing `VITE_BACKEND_API_KEY` / `BACKEND_API_KEY`.  
  - 503 → backend can’t reach Supabase (URL/key or network).
- **Backend terminal**: Any errors when the frontend loads?  
- **Supabase Dashboard → Table Editor**: Do `todos` / `whiteboard` have rows with `user_id` = your `DEFAULT_USER_ID`?

---

## 5. Summary

| Symptom              | Likely cause                                      |
|----------------------|---------------------------------------------------|
| No network requests  | `VITE_BACKEND_URL` missing or wrong; restart dev |
| 401 on /api/todos    | API key mismatch (frontend vs backend)             |
| 503                  | Supabase URL/key wrong or backend unreachable    |
| 200 but empty array | No rows in DB for that `DEFAULT_USER_ID`         |
