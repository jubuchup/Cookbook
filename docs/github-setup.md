# GitHub setup (one-time)

These are the manual steps to take in your GitHub repo (`jubuchup/Cookbook`)
after the code in this commit is pushed. None of this is automatable from
outside GitHub's web UI/settings.

## 1. Enable GitHub Pages, source = GitHub Actions

Repo → **Settings** → **Pages** → under "Build and deployment", set
**Source** to **GitHub Actions** (not "Deploy from a branch"). This is
required for `deploy.yml` (which uses `actions/deploy-pages`) to work.

## 2. Allow Actions to open pull requests

`sync.yml` opens a PR automatically via `peter-evans/create-pull-request`.
By default, GitHub restricts the auto-generated `GITHUB_TOKEN` from creating
PRs. Enable it:

Repo → **Settings** → **Actions** → **General** → scroll to "Workflow
permissions" → select **Read and write permissions** → check **Allow GitHub
Actions to create and approve pull requests** → Save.

## 3. Push the code

From your local clone (already set up in this session):

```
git add .
git commit -m "Add Sheet-to-DuckDB sync pipeline and Pages site"
git push origin main
```

Pushing to `main` will immediately trigger `deploy.yml`, which deploys
whatever is currently in `data/tracker.duckdb` (already synced once locally
during development, containing recipes R001/R002) to Pages.

## 4. Run the sync workflow for the first time

Repo → **Actions** tab → left sidebar → **"Sync Google Sheet to DuckDB"** →
**Run workflow** button (top right) → confirm on the `main` branch → **Run
workflow**.

This runs `scripts/sync.py` against the two published CSV URLs already
hardcoded in that script as defaults, rebuilds `data/tracker.duckdb`, and
opens a pull request titled "Sync tracker.duckdb from Google Sheet" if the
data actually changed. If nothing changed since the last sync, no PR is
opened (nothing to merge).

## 5. Review and merge the sync PR

Open the PR, sanity-check the diff (DuckDB files are binary, so GitHub will
just show "Binary file not shown" — trust the workflow's log output instead,
which prints row counts and flags any mismatch between the sheet's SUMIF
totals and DuckDB's recomputed sums). Merge it.

Merging to `main` automatically re-triggers `deploy.yml`, redeploying the
updated data to Pages within a minute or two.

## 6. Find your Pages URL

Repo → **Settings** → **Pages** → the live URL is shown at the top once the
first deploy succeeds. Typically `https://jubuchup.github.io/Cookbook/`.

## Ongoing workflow (every time you update the sheet)

1. Edit the Google Sheet (add ingredients, mark a recipe `core`, etc.).
2. Actions tab → run "Sync Google Sheet to DuckDB" → wait for the PR.
3. Merge the PR.
4. Done — Pages redeploys automatically.

No local machine involvement needed after the initial push; everything from
step 2 onward runs on GitHub's infrastructure.

## Notes on data visibility

The Google Sheet is published to the web (anyone with the link can view the
CSV export), and the GitHub repo/Pages site is public — this was a
deliberate simplicity tradeoff over setting up a Google service account +
private Sheets API access. If you later want the sheet fully private, switch
`scripts/sync.py` to use the Google Sheets API with a service account
instead of the two `*_CSV_URL` constants, and store the service account key
as a repo secret consumed by `sync.yml`.
