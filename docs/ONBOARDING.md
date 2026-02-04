# Onboarding — Noted

Quick steps to get a **general user** from zero to using the app.

---

## Who is this for?

Anyone who wants one place for **TODOs** and **notes**: work, ideas, code snippets, daily priorities. The app works in the browser and on Android/iOS.

---

## Step 1: Open the app

Choose how you use it:

| How you use it | What to do |
|----------------|------------|
| **Someone gave you a link** | Open the link in your browser (e.g. `https://...` or `http://localhost:5173`). |
| **You run it on your computer** | See [HOW-TO-USE.md — Running the app](./HOW-TO-USE.md#1-running-the-app). In short: `cd my-notepad`, `npm install`, `npm run dev`, then open **http://localhost:5173**. |
| **On your phone (Android/iOS)** | Install the app from the store or open the link your team shared. If you built it yourself, see [HOW-TO-USE.md — Android and iOS](./HOW-TO-USE.md#8-running-on-android-and-ios). |

You should see **Noted** with two tabs: **Todos** and **Notes**.

---

## Step 2: Add your first TODO

1. Go to the **Todos** tab (if not already there).
2. Type a task in the input (e.g. “Call mom”, “Finish report”).
3. Optionally choose:
   - **Priority** (red = high, yellow = medium, cyan = low).
   - **Category** (Work, Health, Friends, Personal, Fitness, Ideas).
   - **Due date** (calendar).
4. Add the task (button or Enter).
5. Later: tap the circle to **mark it done**, or use the delete control to remove it.

You’re set: use Todos for anything you want to track and complete.

---

## Step 3: Write your first note

1. Open the **Notes** tab.
2. Type or paste in the big text area (meeting notes, ideas, code, anything).
3. If the app is connected to a backend, notes **save automatically** and can sync across your devices.
4. Optional: use **“Process with AI”** (when available) to get a summary, tags, and action items — those can be added as TODOs for you.

Notes are your scratchpad; TODOs are what you do with them.

---

## Step 4: Make it yours (optional)

- **Filter TODOs:** Use the category filter to show only Work, Health, Done, etc.
- **Pull to refresh:** On mobile, when sync is on, pull down at the top to reload data.
- **Sync + AI:** If you want data to sync and “Process with AI”, someone with access needs to set up the backend and give you the app URL. Details: [HOW-TO-USE.md — Optional backend](./HOW-TO-USE.md#7-optional-backend-and-sync) and [Process with AI](./HOW-TO-USE.md#5-ai-insights-and-process-with-ai).
- **Voice input:** On Android/iOS, use the mic in the Notes tab to speak and have it transcribed into the note.

---

## Quick recap

| Step | Action |
|------|--------|
| 1 | Open the app (link or run it). |
| 2 | Add a TODO; mark it done or delete it. |
| 3 | Write a note in the Notes tab; use “Process with AI” if available. |
| 4 | Use filters, sync, and voice as needed. |

For full details (backend, env vars, troubleshooting), see **[HOW-TO-USE.md](./HOW-TO-USE.md)**.
