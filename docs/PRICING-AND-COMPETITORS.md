# Noted — Pricing Strategy & Competitor Analysis

This document summarizes what Noted offers, competitor pricing, and a proposed paid offer for all audiences.

---

## 1. What Noted Offers

**Noted** is a personal **TODO and note-taking** app: one place for work, code, ideas, and life—without the noise.

### Core Features (Today)

| Area | Features |
|------|----------|
| **TODOs** | Priorities (Low / Medium / High), categories (Work, Health, Friends, Personal, Fitness, Ideas), due dates, link to source note, mark done, filter by category/area, tree view grouped by note |
| **Notes (whiteboard)** | Single free-form text area, auto-save when backend is configured |
| **AI** | “Process with AI”: summary, tags, action items from notes; action items auto-added as TODOs (linked to note) |
| **Sync** | Optional backend + Supabase: cross-device sync for TODOs and whiteboard |
| **Platforms** | Web (browser), Android, iOS (Capacitor hybrid) |
| **Voice** | Voice input on native mobile (Spanish / English) for notes |
| **Auth** | Single-user today; future: login/logout, multiuser |

### Positioning

- **Personal first:** “The app works for you.” Calm, focused, no clutter.
- **Notes + tasks in one:** Capture in notes, turn into TODOs with AI.
- **Privacy-friendly:** Can run fully local (no backend); optional cloud sync.
- **Cross-platform:** Same experience on web and mobile.

---

## 2. Competitors & Pricing (2024–2025)

### Notes + Tasks / All-in-one

| Product | Free | Paid (individual) | Paid (team) | Notes |
|--------|------|--------------------|-------------|-------|
| **Notion** | Free (unlimited for individuals) | Plus **$10/mo**; Business **$20/mo** (AI included) | Business $20/mo; Enterprise custom | AI trial on Free/Plus; full AI on Business+. Yearly ~20% off. |
| **Evernote** | 50 notes, 1 device | Starter **$14.99/mo**; Advanced **$24.99/mo** | Enterprise custom | AI (assistant, search, transcription) on paid. |
| **Todoist** | Beginner: 5 projects, 3 filters, 1 week history | **Pro** (per user/mo, ~$4–5); 300 projects, calendar, Task Assist, 150 filters | **Business** (per user + tax); 500 team projects, 1000 members | 20% off yearly. SOC2. |
| **TickTick** | Limited lists/tasks | **Premium** ~**$35.99/year** (~$3/mo) or **$2.99/mo**; calendar, filters, themes, Pomodoro | — | 25% edu discount. |
| **Bear** | Core features free | **Pro** **$2.99/mo** or **$29.99/year**; sync, export, themes | — | Apple-focused; sync + encryption. |
| **Obsidian** | App free | **Sync** Standard **$4/mo**, Plus **$8/mo** (sync + storage only) | — | Notes app; sync is add-on. |

### Takeaways

- **Free tiers:** Most have a usable free tier (Notion, Todoist, TickTick, Bear, Obsidian); Evernote’s free tier is tight (50 notes, 1 device).
- **Individual paid:** Roughly **$3–15/mo** for “pro” or “plus” (TickTick/Bear ~$3, Todoist Pro ~$4–5, Notion Plus $10, Evernote $15–25).
- **AI:** Notion/Evernote bundle AI in higher tiers; Todoist has “Task Assist” in Pro.
- **Sync:** Often gated in paid (Bear, Evernote, Obsidian Sync); Notion/Todoist include sync in free/paid.

---

## 3. Proposed Pricing for Noted

Goal: **One clear free tier + one simple paid tier** that is attractive for students, individuals, and later for small teams, without undercutting sustainability.

### Tier 1: Free — “Noted”

**Price:** $0, forever.

**Included:**

- Unlimited TODOs (priorities, categories, due dates, link to note).
- One whiteboard (notes); session-only without backend.
- Full UI: tabs, filters, tree view by note, mark done.
- Use on **one device** (browser or one native app); no cloud sync.
- No “Process with AI”; no cloud storage.

**Audience:** Try the product, students, minimal needs, privacy-only local use.

---

### Tier 2: Pro — “Noted Pro”

**Price:**

- **Monthly:** **$3.99**/month.
- **Yearly:** **$34.99**/year (~**$2.92**/month) — **save ~27%.**

**Included:**

- Everything in Free.
- **Cloud sync** (TODOs + whiteboard across web + Android + iOS).
- **Process with AI:** summary, tags, action items; auto-add TODOs linked to note.
- **Voice input** on mobile (when using native app).
- **Priority support** (email).

**Audience:** Individuals who want sync + AI + voice without paying Notion/Evernote-level prices.

**Why this price:**

- Below Notion Plus ($10) and Evernote Starter ($15); in line with Bear/TickTick (~$3/mo), but with **sync + AI** included.
- Simple single price; no per-seat complexity for individuals.

---

### Tier 3: Team — “Noted Team” (Future)

**Price:** To be defined when multiuser/teams ship (e.g. **$6.99/user/month** or similar, with yearly discount).

**Planned:**

- Multi-user accounts (login/logout).
- Shared workspaces or shared lists (scope TBD).
- Same Pro features (sync, AI, voice) per user.
- Optional: admin controls, central billing.

**Audience:** Small teams, freelancers with clients, families.

---

## 4. Discounts & Promotions

| Audience | Offer |
|----------|--------|
| **Students & educators** | **40% off** Pro (yearly or monthly) with valid .edu or school email. |
| **Early adopters** | First **1,000** paid users: **lifetime 50% off** Pro (lock in $1.99/mo or $17.49/year equivalent). |
| **Yearly** | ~27% off vs monthly ($34.99/year vs $3.99×12). |
| **Referral** | Give one month free Pro for each referred user who subscribes (cap per account TBD). |

---

## 5. Comparison: Noted vs Competitors (Individual Use)

| | Noted Free | Noted Pro | Todoist Pro | Notion Plus | Evernote Starter | TickTick Premium | Bear Pro |
|--|------------|-----------|-------------|-------------|------------------|-------------------|----------|
| **Price** | $0 | $3.99/mo or $34.99/yr | ~$4–5/mo | $10/mo | $14.99/mo | ~$3/mo | $2.99/mo |
| **TODOs + priorities** | ✅ | ✅ | ✅ | ✅ (DB) | ✅ | ✅ | ❌ |
| **Notes / whiteboard** | ✅ (1, local) | ✅ (1, synced) | Limited | ✅ | ✅ | ✅ | ✅ |
| **Cloud sync** | ❌ | ✅ | ✅ | ✅ | Paid | ✅ | ✅ |
| **AI (summarize → TODOs)** | ❌ | ✅ | Task Assist | Trial / paid | Paid | ❌ | ❌ |
| **Voice input (mobile)** | ❌ | ✅ | — | — | — | — | — |
| **Web + Android + iOS** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | iOS/Mac |
| **Simple, personal focus** | ✅ | ✅ | ✅ | More complex | ✅ | ✅ | ✅ |

**Noted Pro** competes on: **low price**, **sync + AI + voice in one**, **one product for notes and tasks**, **privacy option (free = local only)**.

---

## 6. Implementation Notes (When You Add Payments)

- **Stripe** (or similar): subscriptions for Pro monthly/yearly; optional Team later.
- **Feature flags:** Free vs Pro (sync, AI, voice) based on subscription status.
- **Backend:** Validate subscription (e.g. Stripe customer/subscription id) before enabling sync/AI for that user.
- **Free tier:** No payment required; enforce “one device, no sync, no AI” in app and backend.

---

## 7. Summary

- **Project:** Noted = personal TODO + notes (whiteboard), with optional AI (Process with AI), sync, and voice on mobile; web + Android + iOS.
- **Competitors:** Notion $10–20/mo, Evernote $15–25/mo, Todoist ~$4–5/mo, TickTick ~$3/mo, Bear ~$3/mo. Most offer free + paid; AI often in higher tiers.
- **Offer:**  
  - **Free:** Full app, one device, no sync, no AI.  
  - **Pro:** **$3.99/mo** or **$34.99/year** — sync, AI, voice, priority support.  
  - **Team:** Later, when multiuser exists.  
- **Discounts:** Students 40% off; early adopters lifetime 50% off; yearly ~27% off; optional referral month free.

This keeps Noted attractive for **all audiences** (free users, students, individuals, future teams) while staying below typical competitor pricing and highlighting sync + AI + voice in one product.
