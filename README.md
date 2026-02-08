# Noted — Notes & TODO

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
| **Landing** | Minimal marketing page at `/` (SEO, Open Graph, JSON-LD). Native (iOS/Android) opens directly at `/app`. |
| **Frontend app** | React 19 + Vite + TypeScript + Tailwind CSS 4. TODO list (with priorities), Notes (create/edit/delete), tab navigation, auto-save. App at `/app`. |
| **Platforms** | **Hybrid:** same codebase runs in **browser**, **Android**, and **iOS** via Capacitor. |
| **Data** | LocalStorage persistence; optional **Supabase** for cloud sync (see [my-notepad/docs/SUPABASE-SETUP.md](./my-notepad/docs/SUPABASE-SETUP.md)). |
| **Backend** | Node.js service: **OpenAI API** (chat, completions, note processing), **Supabase** (todos, whiteboard), API-key auth. **Auth:** Google OAuth and **email/password** (register and login from landing; no email verification). See [backend/README.md](./backend/README.md). |

### Tech summary

- **my-notepad:** Vite, React 19, TypeScript, Tailwind 4, Zustand, Capacitor, Supabase client, backend API client.
- **backend:** Express, OpenAI, Supabase, routes for `/api/openai/*`, `/api/auth/*` (Google + email/password), `/api/todos`, `/api/whiteboard`.

### Quick start

```bash
# Frontend (browser)
cd my-notepad && npm install && npm run dev   # → http://localhost:5173

# Backend (optional: OpenAI + Supabase)
cd backend && cp .env.example .env && npm install && npm run dev   # → http://localhost:3000
```

**Tests:** Backend unit tests in `backend/` (Vitest + Supertest); frontend unit tests in `my-notepad/` (Vitest + React Testing Library); **feature (E2E) tests** in `my-notepad/` (Playwright). From repo root: `npm run test` runs backend + frontend unit tests; `npm run test:e2e` runs Playwright E2E (start dev server first or set `PLAYWRIGHT_TEST_BASE_URL`). Pre-commit runs backend unit tests only (`git commit --no-verify` to skip).

See [1-objectives.md](./1-objectives.md) for the full story and motivation.

**How to use the app:** [docs/HOW-TO-USE.md](./docs/HOW-TO-USE.md) — run, configure, TODOs, notes, AI, voice, backend, and troubleshooting.

**Deploy:** Frontend on **Vercel** (root directory: `my-notepad`), backend on Railway or Render. See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

---

## Repository Structure

| Path | Description |
|------|-------------|
| `my-notepad/` | Main app (React + Vite + TypeScript + Capacitor). Landing at `/`, app at `/app`. [my-notepad/README.md](./my-notepad/README.md) |
| `backend/` | Node.js backend: OpenAI + Supabase. [backend/README.md](./backend/README.md) |
| `docs/HOW-TO-USE.md` | **User guide:** how to run and use the app |
| `docs/PRICING-AND-COMPETITORS.md` | **Pricing & competitors:** offer, competitor comparison, proposed paid tiers |
| `docs/BUGS.md` | **Known bugs:** tracked issues and fixes |
| `1-objectives.md` | Why this app exists and what it’s for |
| `PROJECT_SUMMARY.md` | Feature and stack overview |

---

Welcome to the journey.
