# My Notepad — Notes & TODO

A personal **TODO and notekeeper** app for 2026. One place to capture what matters: work, code, ideas, and life—without the noise.

---

## Purpose

Important things are always happening, and it's easy to lose track:

- **Work:** Things at the job you have to remember  
- **Code:** Snippets and ideas you want to keep in mind  
- **Life:** Ideas, projects you start and forget, or start and then drop  

Scattered tools (Slack DMs to yourself, Jira, voice notes) don't give a clear view and don't stop the 80% from slipping away. This app is meant to fix that.

---

## What This App Is For

- **Notes** — Capture ideas, code, and longer thoughts in one place.  
- **TODOs** — Track tasks and follow-through.  
- **Priorities** — See and live by what matters: sport, reading, walking, friends, hobbies, and the rest.  
- **Organization** — A single, calm place instead of chaos across many apps.

The goal: **the app works for you**, not the other way around. It should help keep your mind clear and focused, not add more clutter.

---

## Current Status

**In progress** — built piece by piece. Here’s what exists today.

### Implemented

| Area | Status |
|------|--------|
| **Frontend app** | React 19 + Vite + TypeScript + Tailwind CSS 4. TODO list (with priorities), Notes (create/edit/delete), tab navigation, auto-save. |
| **Platforms** | **Hybrid:** same codebase runs in **browser**, **Android**, and **iOS** via Capacitor. |
| **Data** | LocalStorage persistence; optional **Supabase** for cloud sync (see [my-notepad/docs/SUPABASE-SETUP.md](./my-notepad/docs/SUPABASE-SETUP.md)). |
| **Backend** | Node.js service: **OpenAI API** (chat, completions, note processing), **Supabase** (todos, whiteboard), API-key auth. See [backend/README.md](./backend/README.md). |

### Tech summary

- **my-notepad:** Vite, React 19, TypeScript, Tailwind 4, Zustand, Capacitor, Supabase client, backend API client.
- **backend:** Express, OpenAI, Supabase, routes for `/api/openai/*`, `/api/todos`, `/api/whiteboard`.

### Quick start

```bash
# Frontend (browser)
cd my-notepad && npm install && npm run dev   # → http://localhost:5173

# Backend (optional: OpenAI + Supabase)
cd backend && cp .env.example .env && npm install && npm run dev   # → http://localhost:3000
```

See [1-objectives.md](./1-objectives.md) for the full story and motivation.

---

## Repository Structure

| Path | Description |
|------|-------------|
| `my-notepad/` | Main app (React + Vite + TypeScript + Capacitor). [my-notepad/README.md](./my-notepad/README.md) |
| `backend/` | Node.js backend: OpenAI + Supabase. [backend/README.md](./backend/README.md) |
| `1-objectives.md` | Why this app exists and what it’s for |
| `PROJECT_SUMMARY.md` | Feature and stack overview |

---

Welcome to the journey.
