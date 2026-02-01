# Supabase setup (personal use)

Your app syncs **todos** and **notes (whiteboard)** across devices using Supabase.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account).
2. **New project** → choose org, name, password, region → Create.
3. Wait for the project to be ready.

## 2. Get your keys

In the project dashboard:

- **Settings** → **API**.
- Copy:
  - **Project URL** → use as `VITE_SUPABASE_URL`
  - **anon public** key → use as `VITE_SUPABASE_ANON_KEY`

## 3. Configure the app

In the app root (`my-notepad/`):

```bash
cp .env.example .env
```

Edit `.env` and set:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Create tables and RLS

In Supabase: **SQL Editor** → **New query**.

Paste and run the contents of:

**`supabase/schema.sql`**

That creates:

- `notes` – one row per note (id, title, content), scoped by `user_id`
- `todos` – one row per task, scoped by `user_id`; optional `note_id` links to the note they were created from
- `whiteboard` – one row per user for your notes
- Row Level Security so each user only sees their own data

If you already have `todos` and `whiteboard` from before notes existed, run **`supabase/migrations/002_notes_and_todo_note_id.sql`** in the SQL Editor to add the `notes` table and `todos.note_id`.

## 5. Run the app

```bash
npm run dev
```

- **Sign up** with email + password (personal use).
- Confirm email if Supabase email confirmation is on.
- **Sign in** – your todos and notes load from Supabase and sync across devices.

## Optional: disable email confirmation

For a single personal account you can turn off “Confirm email”:

- **Authentication** → **Providers** → **Email** → disable **Confirm email**.

Then sign-up works without checking your inbox.
