# TODO Apps Design Review — Popular Apps & UX Patterns

A short review of leading todo/task apps and how their design can inspire **My Notepad** frontend/UX.

---

## 1. Todoist

**Positioning:** “Clarity, finally” — minimal, cross‑platform, natural language.

- **Visual:** Clean, uncluttered. Dark theme with soft contrast. Multiple themes (Dark, Moonstone, Tangerine; Pro: Kale, Blueberry, Lavender, Raspberry). Project/label colors (20 options).
- **Structure:** Sidebar with **Today**, **Upcoming**, **Filters**, **Projects**. Main area = list + quick add. “Extension of your mind” — fast capture.
- **Takeaways:** Strong focus on “Today” vs “Upcoming”. Single, prominent quick-add. Minimal chrome. Accent color (often red/coral) for actions and highlights. Rounded, friendly UI.

---

## 2. Things 3

**Positioning:** Apple Design Award; “Gets it done without getting in the way.”

- **Visual:** Paper-like, light and dark. Soft shadows, generous whitespace. Tags and color for categories. Smooth, subtle animations.
- **Structure:** **Today** and **Upcoming** at top. **Areas** (Work, Family, etc.) and **Projects** below. Hierarchy: Areas → Projects → Headings → Tasks.
- **Takeaways:** Clear “Today” vs “Upcoming”. Card-like task rows. Strong typography hierarchy. Rounded corners, gentle borders. Feels native and calm.

---

## 3. TickTick

**Positioning:** Feature-rich, calendar + lists + habits.

- **Visual:** Denser UI. 40+ themes. Calendar, Kanban, Eisenhower Matrix. Dark mode.
- **Takeaways:** Power users like views and customization. For a simpler app, we take: clear calendar/date cues, optional “focus” view, consistent use of color for priority/status.

---

## 4. Common UX Patterns (2024–2025)

| Pattern | Description |
|--------|-------------|
| **Today / Upcoming** | Separate “today” from “later”; reduces overload. |
| **Quick add** | One prominent input; natural language where possible. |
| **Card-like rows** | Tasks in rounded, slightly elevated “cards” with clear tap targets. |
| **Color = meaning** | Priority or category via left bar, dot, or tag. |
| **Minimal chrome** | Few persistent buttons; actions in context (swipe, long-press, row actions). |
| **Dark mode** | Warm or cool dark; not pure black. Softer borders (e.g. zinc/neutral). |
| **Typography** | Clear hierarchy: title → section → body → caption. |
| **Rounded UI** | Buttons and cards with rounded corners (e.g. 12px). |

---

## 5. Style Directions to Adapt Here

1. **Warmer dark** — Zinc/neutral instead of cold slate; slight warmth in background/surfaces.
2. **Distinct accent** — Coral/amber (Todoist-like) or soft violet (Things-like) for primary actions and active states.
3. **Card-style tasks** — Rounded task rows, soft border, optional left accent bar; enough padding for touch.
4. **Section labels** — e.g. “Tasks” / “Ideas” above lists; “Today” if we add date grouping.
5. **Softer radius** — `rounded-xl` for main panels and inputs; pills for tabs/filters.
6. **Clarity over density** — Slightly more spacing and font size where it helps readability.

---

## 6. References

- [Todoist](https://www.todoist.com/) — product and marketing.
- [Things](https://culturedcode.com/things/) — Cultured Code.
- [TickTick](https://ticktick.com/) — features and themes.
- Dribbble / design blogs — card layouts, dark mode, and todo UI trends.

---

## 7. Full style applied (2025)

| Area | Implementation |
|------|----------------|
| **Shell** | Tagline under app title; segmented-control style tabs (Tasks / Notes); content area with rounded-2xl, subtle border; max-width 42rem. |
| **Typography** | `.app-title`, `.app-tagline`, `.section-label` (uppercase, tracking); task text 15px, font-medium; empty state headline + sub. |
| **Quick add** | `.quick-add-bar`: single row, rounded-xl, focus ring; placeholder “Add a task…”; priority dots on left; options row below. |
| **Filters** | Horizontal scroll, rounded-full pills, 11px uppercase; active = zinc-600; inactive = zinc-800/80. |
| **Task cards** | `.task-card`: padding, rounded-xl, left priority bar; hover state; completed = opacity 0.6. |
| **Empty state** | `.empty-state`: icon, `.empty-state__title`, `.empty-state__sub`; friendly copy (“Your list is clear”, “Add a task above”). |
| **Notes** | Section label “Notes”; textarea with `.quick-add-bar`, rounded-xl; stats bar uppercase 11px; Process with AI = pill button. |
| **Stats** | Uppercase, 11px, tracking; border-top; centered or spread. |

This doc is the basis for the **full style** applied in the app (see `src/index.css` and components).
