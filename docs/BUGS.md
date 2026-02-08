# Known bugs

Tracked issues and bugs. Add new entries at the top; move to "Fixed" when resolved.

---

## Open

### 1. OpenAI note → todos: expected tag/category not applied

**What happens:** When a note is processed with AI and the user creates todos from the action items, every todo is created with a **hardcoded category** (`ideas`) instead of the note’s intended area/tag.

**Expected:** The category (or “area”) inferred from the note (e.g. work, health, personal, fitness, friends, ideas) should be applied to the todos created from that note’s action items.

**Current behavior:**

- Backend `/api/openai/notes` returns `NoteInsight`: `title`, `summary`, `tags[]`, `actionItems[]`. It does **not** return a single `area` (work | health | friends | personal | fitness | ideas).
- Frontend (`NotesList.tsx`) when creating todos from `actionItems` always sets `category: 'ideas'` (see `backendApi.createTodo({ ..., category: 'ideas', ... })` and local `addTodo({ ..., category: 'ideas', ... })`). The `insight.tags` (and any area) are not used for the todo category.

**Relevant code:**

- `my-notepad/src/components/NotesList.tsx` — “Create todos” flow: `category: 'ideas'` hardcoded in both backend and local branches.
- `backend/src/services/openai.service.ts` — `NoteInsight` and `NOTES_SYSTEM_PROMPT`: only `tags` (free-form) are returned; no `area` field aligned with app categories.

**Possible fixes:**

- **Option A:** Extend backend `NoteInsight` and prompt to return a single `area` (one of work | health | friends | personal | fitness | ideas) and use it as `category` when creating todos.
- **Option B:** Map the first relevant tag from `insight.tags` to an app category (e.g. tag `"work"` → `category: 'work'`) and use that when creating todos; fallback to `'ideas'` if no match.

---

## Fixed

*(Move items here when resolved.)*
