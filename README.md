# prep-os

Your standalone exam prep tracker. Frontend on Netlify, data in Supabase — both free.

## 1. Create the database (Supabase, ~3 minutes)

1. Go to https://supabase.com, sign up free, click "New Project."
2. Name it anything (e.g. `prep-os`), set a database password (save it somewhere), pick the region closest to you, create.
3. Once it's ready, open the **SQL Editor** (left sidebar) and run this:

```sql
create table prep_data (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

alter table prep_data disable row level security;
```

That's your entire database — one table, one row per data type (sessions, topics, checklist, etc), each holding JSON.

Note on the `disable row level security` line: this makes the table openly readable/writable by anyone who has your Supabase URL and anon key. For a personal, unlisted tool this is a reasonable tradeoff for simplicity — nobody will stumble onto your Netlify URL by accident. If you ever want it locked down, re-enable RLS and add an auth-based policy later; not necessary to start.

4. Go to **Project Settings → API**. Copy the **Project URL** and the **anon public key** — you'll need both in step 3.

## 2. Push this code to GitHub

1. Create a new empty repo on GitHub.
2. From this folder:
```
git init
git add .
git commit -m "prep-os"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 3. Deploy to Netlify (free)

1. Go to https://netlify.com, sign up free, click "Add new site" → "Import an existing project" → connect GitHub → pick your repo.
2. Build settings are already set via `netlify.toml` (build command `npm run build`, publish folder `dist`) — Netlify should detect them automatically.
3. Before deploying, go to **Site settings → Environment variables** and add:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon public key
4. Deploy. Netlify gives you a free `.netlify.app` URL — bookmark it, or add it to your phone's home screen for an app-like feel.

## 4. Verify it's actually saving

Open the deployed site, log one entry in "daily log," then go to Supabase → **Table Editor** → `prep_data` — you should see a row appear with key `sessions`. If you see it, persistence is working end to end.

## Backing up

Use the export button (top right, download icon) regularly regardless — it's a second safety net independent of Supabase, and the only way to move your data if you ever change tools.

## Local development (optional)

```
npm install
cp .env.example .env   # then fill in your real Supabase values
npm run dev
```

Note: the current-affairs feed tab only works once deployed on Netlify (it depends on the serverless function at `/.netlify/functions/feed`) — it won't load in local dev unless you run `netlify dev` instead of `npm run dev`.
