# Cookbook

Personal recipe/macro tracker. Google Sheet is the source of truth; a manual
GitHub Action syncs it into a DuckDB file, and a static GitHub Pages site
queries that file live in-browser via duckdb-wasm.

**Live site:** https://jubuchup.github.io/Cookbook/

## Structure

- `scripts/sync.py` — fetches the Recipes + Ingredients tabs (published as
  CSV) and rebuilds `data/tracker.duckdb`.
- `data/tracker.duckdb` — the built database, committed via PR.
- `site/index.html` — the Pages site (recipe list + detail views), loads
  `@duckdb/duckdb-wasm` from a CDN and queries the DuckDB file client-side.
- `.github/workflows/sync.yml` — manual (`workflow_dispatch`) trigger, runs
  `sync.py`, opens a PR with the updated `data/tracker.duckdb`.
- `.github/workflows/deploy.yml` — runs on every push to `main`, deploys
  `site/` (plus a copy of `data/tracker.duckdb`) to GitHub Pages.

## Updating recipes

1. Edit the Google Sheet.
2. In GitHub → Actions → "Sync Google Sheet to DuckDB" → Run workflow.
3. Review and merge the PR it opens.
4. Merging triggers the Pages deploy automatically — the live site updates
   within a minute or two.

See `docs/github-setup.md` for one-time repo setup (Pages source, Actions
permissions, publish-to-web links).

### Optional sheet columns

`scripts/sync.py` also picks up two optional columns on the Recipes tab, if
present:

- `Vegetarian` — `TRUE`/`FALSE`. Shows a green leaf badge on the recipe card.
- `ImageURL` — a public image URL. Shown on the recipe card and detail view.

Both are optional; older sheet exports without them still sync fine.

