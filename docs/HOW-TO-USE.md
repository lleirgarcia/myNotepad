# How to Use My Notepad

This guide explains how to run, configure, and use the **My Notepad** app: TODOs, notes (whiteboard), AI insights, voice input, and optional backend/Supabase.

---

## Table of contents

1. [Running the app](#1-running-the-app)
2. [Using the app (browser)](#2-using-the-app-browser)
3. [TODOs](#3-todos)
4. [Notes (whiteboard)](#4-notes-whiteboard)
5. [AI insights and “Process with AI”](#5-ai-insights-and-process-with-ai)
6. [Voice input (mobile)](#6-voice-input-mobile)
7. [Optional: backend and sync](#7-optional-backend-and-sync)
8. [Running on Android and iOS](#8-running-on-android-and-ios)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Running the app

### Frontend only (no backend)

You can use the app with **local data only** (no server, no Supabase):

```bash
cd my-notepad
npm install
npm run dev
```

Open **http://localhost:5173** in your browser. Data is kept in the browser (in memory for the session; there is no localStorage persistence when using the backend URL — see below). If you **don’t** set a backend URL, the app uses in-memory state only for that session.

### With backend (sync + AI)

To sync TODOs and notes across devices and use **Process with AI**, you need:

1. **Backend** running (Node.js service that talks to OpenAI and Supabase).
2. **Environment variables** in the frontend pointing to that backend.

**Backend:**

```bash
cd backend
cp .env.example .env
# Edit .env: OPENAI_API_KEY, BACKEND_API_KEY, DEFAULT_USER_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev
```

Backend runs at **http://localhost:3000** by default.

**Frontend:** in `my-notepad/`:

```bash
cp .env.example .env
```

Edit `my-notepad/.env`:

```env
VITE_BACKEND_URL=http://localhost:3000
VITE_BACKEND_API_KEY=your-secret-api-key-here
```

Use the **same** value for `VITE_BACKEND_API_KEY` as `BACKEND_API_KEY` in `backend/.env`. Restart the frontend dev server after changing `.env`.

Then:

```bash
cd my-notepad
npm run dev
```

Open **http://localhost:5173**. The app will load TODOs and whiteboard from the backend and show “Loading your data…” until the first fetch completes.

---

## 2. Using the app (browser)

- **Tabs:** Switch between **Todos** and **Notes** at the top.
- **Pull to refresh (mobile / touch):** When the backend is configured, pull down at the top to reload TODOs and notes from the server.
- **Footer:** Link to the author (Lleïr).

---

## 3. TODOs

### What you can do

- **Add a task:** Type in the input, choose **priority** (red / yellow / cyan), **category**, optional **due date**, and optional **source note**. Click add (or use the button) to create the todo.
- **Categories:** Work, Health, Friends, Personal, Fitness, Ideas / Thoughts. Use the category filter to show only certain categories (or “Done”).
- **Mark complete:** Check the circle to mark a task done. It may move to a “completed” state and can be filtered.
- **Delete:** Use the delete control on a task to remove it.
- **Due date:** Optional; show in list and use for ordering/reminders.
- **Link to a note:** When you create TODOs from “Process with AI” (see Notes), they can be linked to that note so you can filter or group by note.

### Priority colors

- **Red** – high priority  
- **Yellow** – medium  
- **Cyan** – low / default  

Tasks are ordered by priority and other rules in the list.

### Filtering

Use the category filter to show:

- A single category (e.g. Work, Health),
- Or “Done” to see completed tasks.

---

## 4. Notes (whiteboard)

The **Notes** tab is a single **whiteboard**: one big text area for free-form notes.

- **Type or paste** your text. When the backend is configured, content is **saved automatically** (debounced) to the server so it syncs across devices.
- **No backend:** Content stays in memory for the session only.
- Use this for meeting notes, ideas, code snippets, or anything you want to turn into TODOs or insights later.

---

## 5. AI insights and “Process with AI”

If the **backend** is running and the frontend has `VITE_BACKEND_URL` set:

1. Write or paste text in the **Notes** whiteboard.
2. Click **“Process with AI”**.
3. The app sends the text to the backend; the backend uses **OpenAI** to return:
   - **Summary**
   - **Tags**
   - **Action items** (list of suggested tasks)
4. **AI insights** are shown in a collapsible “AI insights” section (summary, tags, action items).
5. **Action items are automatically added as TODOs** (in the “Ideas” category, cyan priority). If the backend supports it, they can be linked to a note. You can then switch to the **Todos** tab and see them.

**Requirements:** Backend running, `OPENAI_API_KEY` set in `backend/.env`, and frontend configured with `VITE_BACKEND_URL` (and optionally `VITE_BACKEND_API_KEY` if the backend uses API key auth). No login in the app; the backend uses a single “user” (e.g. `DEFAULT_USER_ID`) for personal use.

---

## 6. Voice input (mobile)

On **Capacitor native apps** (Android / iOS), the Notes tab can use **voice input**:

- **Mic button:** Start/stop recording. Speech is transcribed and **appended** to the whiteboard text.
- **Language:** Switch between **Spanish (ES)** and **English (US)** for recognition.
- **Permissions:** Allow microphone access when prompted. If something goes wrong, check device settings for the app’s mic permission.

Voice input uses `@capacitor-community/speech-recognition` and is only available when running the app as a native build (e.g. `cap run android` or `cap run ios`), not in the browser.

---

## 7. Optional backend and sync

### What the backend does

- **TODOs:** CRUD via `/api/todos` (and per-id PATCH/DELETE). Stored in **Supabase** (or your DB) under a single user id.
- **Whiteboard:** GET/PUT `/api/whiteboard`. One blob per user, stored in Supabase.
- **Notes (for grouping TODOs):** Optional; create note via backend when creating TODOs from “Process with AI”.
- **OpenAI:** `/api/openai/notes` for “Process with AI”; optional chat/completion endpoints.

### Environment variables

**Backend (`backend/.env`):**

- `OPENAI_API_KEY` – required for “Process with AI”.
- `PORT` – default 3000.
- `BACKEND_API_KEY` – secret; frontend must send this (as `X-API-Key` or similar) to call protected routes.
- `DEFAULT_USER_ID` – UUID used as the single “user” for all data (personal use).
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` – for persisting TODOs and whiteboard.

**Frontend (`my-notepad/.env`):**

- `VITE_BACKEND_URL` – e.g. `http://localhost:3000`.
- `VITE_BACKEND_API_KEY` – same value as backend’s `BACKEND_API_KEY`.

If you use **Supabase** only from the backend (no Supabase in the frontend), you don’t need `VITE_SUPABASE_*`. For a Supabase-only frontend setup (no Node backend), see [my-notepad/docs/SUPABASE-SETUP.md](../my-notepad/docs/SUPABASE-SETUP.md).

### Sync behavior

- **Pull to refresh:** Reloads TODOs and whiteboard from the backend.
- **Adding/editing/deleting TODOs** and **editing the whiteboard** are sent to the backend when `VITE_BACKEND_URL` is set; the backend writes to Supabase (or your DB).

---

## 8. Running on Android and iOS

The app is a **Capacitor** hybrid app: same code runs in browser, Android, and iOS.

- **Android:** Install Android Studio and SDK. Then:
  ```bash
  cd my-notepad
  npm run build:mobile
  npm run cap:android
  ```
  Open the project in Android Studio and run on a device or emulator.

- **iOS:** macOS, Xcode, CocoaPods. Then:
  ```bash
  cd my-notepad
  npm run build:mobile
  npm run cap:ios
  ```
  Open the project in Xcode and run on a device or simulator.

For keyboard issues on iOS, see [my-notepad/docs/DEBUG-KEYBOARD-IOS.md](../my-notepad/docs/DEBUG-KEYBOARD-IOS.md).

---

## 9. Troubleshooting

| Problem | What to check |
|--------|----------------|
| “Loading your data…” never finishes | Backend running? Correct `VITE_BACKEND_URL`? Same `VITE_BACKEND_API_KEY` as backend `BACKEND_API_KEY`? CORS allowed on backend for the frontend origin? |
| “Process with AI” fails or no insights | Backend running? `OPENAI_API_KEY` set in `backend/.env`? Network tab: does `/api/openai/notes` return 200? |
| TODOs or notes don’t save | Backend running? Supabase env vars set in `backend/.env`? Backend logs for errors. |
| Voice input not available | Voice is only in native builds (Capacitor). Run `cap run android` or `cap run ios`, and grant microphone permission. |
| Pull to refresh does nothing | Pull-to-refresh only works when `VITE_BACKEND_URL` is set. |

---

## Summary

- **Todos tab:** Add, complete, delete, filter by category; set priority, due date, and optional note link.
- **Notes tab:** One whiteboard; auto-save when backend is configured; **Process with AI** to get summary, tags, and action items (and auto-add action items as TODOs); voice input on native mobile.
- **Backend optional:** Use it for sync and AI; without it, the app still works with in-memory/session state.
- **Docs:** Backend API details in [backend/README.md](../backend/README.md); Supabase-only setup in [my-notepad/docs/SUPABASE-SETUP.md](../my-notepad/docs/SUPABASE-SETUP.md).
