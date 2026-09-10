#!/usr/bin/env python3
"""
Sync the Google Sheet (Recipes + Ingredients tabs) into a local DuckDB file.

Source of truth: a Google Sheet published to the web as CSV (per-tab links).
This does a full rebuild every run (drop + recreate tables) rather than an
incremental update, to avoid drift between the sheet and the DuckDB file.

Usage:
    python scripts/sync.py

Env vars (optional overrides - defaults point at the personal food sheet):
    RECIPES_CSV_URL
    INGREDIENTS_CSV_URL
    OUTPUT_DB_PATH   (default: data/tracker.duckdb)
"""

import os
import sys
import urllib.request
import urllib.error

import duckdb

RECIPES_CSV_URL = os.environ.get(
    "RECIPES_CSV_URL",
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQRbel8WuR1VbWzqQGoFUI21NeVr9YcL2Zv1582p9QI7xn35xsbrDqOqGMJyExsw2ov2KuFAzE3VaYA/pub?gid=1892474064&single=true&output=csv",
)
INGREDIENTS_CSV_URL = os.environ.get(
    "INGREDIENTS_CSV_URL",
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQRbel8WuR1VbWzqQGoFUI21NeVr9YcL2Zv1582p9QI7xn35xsbrDqOqGMJyExsw2ov2KuFAzE3VaYA/pub?gid=0&single=true&output=csv",
)
OUTPUT_DB_PATH = os.environ.get("OUTPUT_DB_PATH", "data/tracker.duckdb")

REQUEST_TIMEOUT_SECONDS = 30


def fetch_csv(url: str, label: str) -> str:
    """Download a published Google Sheets CSV export and return its raw text."""
    req = urllib.request.Request(url, headers={"User-Agent": "sync.py"})
    try:
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_SECONDS) as resp:
            raw = resp.read()
    except urllib.error.URLError as exc:
        raise SystemExit(f"Failed to fetch {label} CSV from {url}: {exc}")

    text = raw.decode("utf-8-sig")  # sheets export sometimes includes a BOM

    if not text.strip():
        raise SystemExit(f"{label} CSV came back empty - check the publish-to-web link is still valid")

    # Google returns an HTML error page (not CSV) if the link is wrong/unpublished.
    if text.lstrip().lower().startswith(("<!doctype html", "<html")):
        raise SystemExit(
            f"{label} CSV URL did not return CSV data (got HTML instead). "
            f"Re-check the 'Publish to web' link for that tab: {url}"
        )

    return text


def write_csv_to_temp(text: str, filename: str) -> str:
    """Write CSV text to a temp file so DuckDB can read it with read_csv_auto."""
    path = os.path.join("/tmp", filename)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    return path


def build_database(recipes_csv_path: str, ingredients_csv_path: str, db_path: str) -> None:
    """Build a fresh DuckDB file at db_path.

    Builds into a temp path first, then atomically replaces db_path. This
    avoids needing to delete/reopen an existing file in place (which can hit
    file-lock/permission issues on some filesystems) and means a crash
    mid-build never leaves a half-written file at db_path.
    """
    os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)

    tmp_db_path = db_path + ".tmp"
    for path in (tmp_db_path, tmp_db_path + ".wal"):
        if os.path.exists(path):
            os.remove(path)

    con = duckdb.connect(tmp_db_path)
    try:
        con.execute(
            f"""
            CREATE TABLE recipes AS
            SELECT
                RecipeID       AS recipe_id,
                Name           AS name,
                Category       AS category,
                Status         AS status,
                Servings       AS servings,
                PrepTime       AS prep_time,
                Steps          AS steps,
                Notes          AS notes,
                TotalKcal      AS sheet_total_kcal,
                TotalProtein   AS sheet_total_protein,
                TotalCarbs     AS sheet_total_carbs,
                TotalFat       AS sheet_total_fat
            FROM read_csv_auto('{recipes_csv_path}', header=True, ALL_VARCHAR=False)
            WHERE Name IS NOT NULL AND trim(Name) != ''
            """
        )

        con.execute(
            f"""
            CREATE TABLE ingredients AS
            SELECT
                RecipeID        AS recipe_id,
                IngredientName  AS ingredient_name,
                Amount          AS amount,
                Unit            AS unit,
                Kcal            AS kcal,
                Protein         AS protein,
                Carbs           AS carbs,
                Fat             AS fat
            FROM read_csv_auto('{ingredients_csv_path}', header=True, ALL_VARCHAR=False)
            """
        )

        # Recomputed totals (mirrors the sheet's SUMIF formulas) so the site
        # can trust DuckDB's numbers even if the sheet's formula cells are
        # ever blank/stale in a given export.
        con.execute(
            """
            CREATE VIEW recipe_totals AS
            SELECT
                recipe_id,
                SUM(kcal)    AS total_kcal,
                SUM(protein) AS total_protein,
                SUM(carbs)   AS total_carbs,
                SUM(fat)     AS total_fat
            FROM ingredients
            GROUP BY recipe_id
            """
        )

        recipe_count = con.execute("SELECT COUNT(*) FROM recipes").fetchone()[0]
        ingredient_count = con.execute("SELECT COUNT(*) FROM ingredients").fetchone()[0]
        print(f"Loaded {recipe_count} recipes and {ingredient_count} ingredient rows into {db_path}")

        # Sanity check: flag any recipe whose recomputed totals disagree with
        # the sheet's own SUMIF totals by more than a rounding tolerance.
        mismatches = con.execute(
            """
            SELECT r.recipe_id, r.name,
                   r.sheet_total_kcal, t.total_kcal,
                   r.sheet_total_protein, t.total_protein
            FROM recipes r
            JOIN recipe_totals t USING (recipe_id)
            WHERE abs(r.sheet_total_kcal - t.total_kcal) > 1
               OR abs(r.sheet_total_protein - t.total_protein) > 1
            """
        ).fetchall()
        if mismatches:
            print("WARNING: totals mismatch between sheet formulas and recomputed sums:")
            for row in mismatches:
                print(f"  {row}")

        # Force a checkpoint so all data is flushed into the main .duckdb
        # file and no .wal sidecar is left behind (keeps the committed
        # artifact self-contained as a single file).
        con.execute("CHECKPOINT")
    finally:
        con.close()

    # Atomic swap into place. Remove any leftover .wal next to the temp file
    # first (CHECKPOINT above should have already merged it away).
    if os.path.exists(tmp_db_path + ".wal"):
        os.remove(tmp_db_path + ".wal")
    os.replace(tmp_db_path, db_path)


def main() -> None:
    print("Fetching Recipes tab...")
    recipes_text = fetch_csv(RECIPES_CSV_URL, "Recipes")
    print("Fetching Ingredients tab...")
    ingredients_text = fetch_csv(INGREDIENTS_CSV_URL, "Ingredients")

    recipes_csv_path = write_csv_to_temp(recipes_text, "recipes.csv")
    ingredients_csv_path = write_csv_to_temp(ingredients_text, "ingredients.csv")

    build_database(recipes_csv_path, ingredients_csv_path, OUTPUT_DB_PATH)
    print("Sync complete.")


if __name__ == "__main__":
    main()
