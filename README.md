# Cookbook

Personal recipe/food-tracking app, used by a handful of people to view,
create, and edit recipes. It's a PWA — installable via "Add to Home
Screen" on iOS Safari (not an App Store app) — that also works as a normal
desktop web app.

**Live app:** deployed via Cloudflare Pages (see `ios-cookbook/`).

## Current architecture

- **Frontend:** `ios-cookbook/` — a Vite + React + Tailwind SPA (iOS-style
  UI: recipe cards, filters, favorites, a "what's in my fridge" ingredient
  matcher, and a step-by-step cooking mode with timers).
- **Database:** Supabase (Postgres) project "Cookbook". The `recipes` table
  is queried and written directly from the browser using the public
  anon/publishable key — there's no backend/API layer in this phase. See
  `docs/supabase-schema-migration.sql` for the schema.
- **Hosting:** Cloudflare Pages, connected to this repo, deploying
  automatically on push to `main`. Build settings: root directory
  `ios-cookbook`, build command `npm run build`, output directory `dist`.
- **Recipe entry:** stays AI-assisted but manual on purpose — paste a
  recipe (or its URL) into a free chat AI (ChatGPT/Claude web app) using
  the prompt template built into the app's "Paste from AI Chat" tab, which
  returns structured JSON; paste that JSON back into the app to create the
  recipe. No AI API key is used by the app itself — see
  `docs/cookbook-app-handoff.md`-derived notes below for why.

**Current phase: intentionally simple, no-auth testing setup.** The app is
fully public — anyone with the URL can read and write all recipes. Google
login and per-recipe private/shared visibility are planned but deferred
until this testing phase works end-to-end.

## Repo structure

- `ios-cookbook/` — the app (current, active).
- `docs/supabase-schema-migration.sql` — one-time SQL to extend the
  Supabase `recipes` table with the columns the app needs (run once in the
  Supabase SQL editor).
- `docs/design-spec.md`, `docs/github-setup.md` — earlier design/setup
  notes, kept for reference.
- `docs/motherduck-migration-spec.md` — an earlier, now-superseded plan to
  migrate to MotherDuck + Cloudflare Worker. Superseded by the
  Supabase-based approach above; kept only for historical context.
- `site/`, `scripts/sync.py`, `data/tracker.duckdb`,
  `.github/workflows/sync.yml`, `.github/workflows/deploy.yml` — the
  original read-only Google Sheet → DuckDB → GitHub Pages setup. No longer
  the active app; left in place but not maintained. Safe to remove once
  the Supabase/Cloudflare Pages setup is confirmed working end-to-end.

## Updating recipes

1. Open the app, tap "+", then "Paste from AI Chat".
2. Copy the built-in prompt template, paste it (plus a recipe or a link to
   one) into ChatGPT, Claude, or another free chat app.
3. Copy the JSON the chat gives back, paste it into the app, and tap
   "Create Recipe from Pasted JSON".

Or use "Manual Entry" to fill out the form directly.
