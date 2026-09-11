# Cookbook Design Spec

Working name: **Rotation** — a nod to the "core rotation vs. trial pile" model that
makes this different from a generic recipe app. This spec extends the palette
already live in `site/index.html`, tuned against four moodboard references, and
oriented around what this app actually is: a personal macro-tracking tool for a
winter bulk, not a recipe blog.

## 0. What this page has to do

One user, one goal: decide what to cook tonight without decision fatigue, and
know the macros before committing. The app's real content is not glossy food
photography — it's a small set of known-good recipes (`core`), a pile of
things being tried (`trial`), and a graveyard (`retired`). That status field
is the most distinctive thing in this brief, and it should be visible
everywhere, not buried in a database column.

## 1. Color

The existing palette is already close to references 1–2 (warm cream, terracotta,
deep green) — keep it as the base and extend it with the three status colors
the app actually needs.

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#faf7f1` | Page background, warm off-white |
| `--panel` | `#ffffff` | Cards, sheets |
| `--border` | `#e8e2d6` | Hairlines, card outlines |
| `--text` | `#262420` | Primary text (near-black, not pure black) |
| `--muted` | `#7c7566` | Secondary text, metadata |
| `--accent` | `#c05a2e` | Terracotta — primary CTA, active states, macro numbers |
| `--accent-soft` | `#f4e3d6` | Terracotta tint — badges, hover fills |
| `--green` | `#3f6b4a` | Deep olive-green — secondary accent, "core" status |
| `--green-soft` | `#e6efe8` | Green tint — core badge fill |
| `--sidebar-bg` | `#22301f` | Dark green sidebar/nav (desktop only) |
| **New: `--trial`** | `#c98a1f` | Amber — trial status (things being tested) |
| **New: `--trial-soft`** | `#f6ead1` | Amber tint |
| **New: `--retired`** | `#9a9284` | Warm gray — retired status (muted, deliberately unglamorous) |

Do not introduce a bright acid accent or a second brand color. The terracotta/
green pair is already doing the work references 1–3 do with orange/olive —
adding amber for `trial` gives the status system a real visual vocabulary
instead of overloading terracotta for both "primary action" and "in progress."

## 2. Type

Keep the system-font body stack already in use (`-apple-system, BlinkMacSystemFont,
"SF Pro Text", "Segoe UI", Helvetica, Arial, sans-serif`) — this is a PWA meant
to feel native on a phone home screen, not a marketing site, so a system stack
is the right choice, not a downgrade.

Add one display face for recipe titles and the empty-state headline, pulling
from reference 2's confident serif rather than reference 4's condensed poster
caps (poster caps read as a print artifact, not an app):

- **Display**: `"Iowan Old Style", "Georgia", serif` — recipe titles on detail
  view, section headers ("Core rotation", "Trial pile"). Used at 1.5–2rem,
  semibold, tight line-height. Restrained: never used for body copy or UI labels.
- **Body / UI**: system sans stack, as today. 0.85–1rem for body, 0.72–0.78rem
  uppercase-tracked for labels and metadata (already the pattern in the current
  CSS — keep it).
- **Numerals**: macro values (kcal/protein/carbs/fat) set in the sans stack but
  bold and slightly larger than surrounding text, in `--accent` — these numbers
  are the actual product, they should never look like decoration.

## 3. Layout

### 3a. List view (`Core rotation` / `Trial` / `Retired` tabs)

Borrows reference 1's row-card pattern and reference 3's stat-pill row, adapted
to macros instead of calories-only:

```
┌─────────────────────────────────────────┐
│ [●Core] [○Trial] [○Retired]              │  ← status tabs, not meal-type tabs
│ ┌───┐  Salmon sauce            ▸         │
│ │img│  ⏱ 45 min · 42g protein           │
│ └───┘                                    │
│ ┌───┐  Chickpea power bowl     ▸         │
│ │img│  ⏱ 15 min · 24g protein           │
│ └───┘                                    │
└─────────────────────────────────────────┘
```

The tab row is the single biggest structural departure from all four
references: it filters by **status** (core/trial/retired), not by meal type.
Meal category becomes a secondary filter (a smaller dropdown or chip row below
the status tabs), because for this user "is this a recipe I trust" matters
more day-to-day than "is this breakfast."

Each row keeps reference 1's thumbnail + chevron shape, but the metadata line
always shows time + protein (the two numbers that matter for a bulk), not a
star rating — this user has no use for a 5-star aggregate on their own recipes.

### 3b. Detail view

Structure follows reference 1/2 closely — it's the right pattern for this
content:

```
┌─────────────────────────────────────────┐
│ ‹                                    ♡  │  ← photo (optional; can be omitted)
│                                          │
├─────────────────────────────────────────┤
│ Salmon sauce                    [CORE]   │  ← serif title + status badge
│ Servings 2 · Prep 45 min                 │
│                                          │
│ ┌────────┬────────┬────────┬────────┐   │
│ │ 420    │ 42g    │ 18g    │ 14g    │   │  ← macro-box row (4, not 3:
│ │ kcal   │protein │ carbs  │  fat   │   │    kcal/protein/carbs/fat)
│ └────────┴────────┴────────┴────────┘   │
│                                          │
│ Ingredients (5)                          │
│  ○ Salmon 300g          [Protein][Fat]   │  ← ingredient tag chips from ref 1
│  ○ ...                                   │
│                                          │
│ Steps                                    │
│  1. ...                                  │
│                                          │
│ [   Mark as core   ]                     │  ← primary CTA is a status action,
└─────────────────────────────────────────┘     not "Rate Recipe" or "Start Cooking"
```

The stat-box row is widened from references 1/2's 3 boxes to **4 boxes**
(kcal, protein, carbs, fat) since that's the actual data model in
`data/tracker.duckdb`'s `recipe_totals` view — don't compress it back down to
3 just to match the reference proportions.

The bottom CTA is repurposed from "Rate Recipe" / "Start Cooking" to a status
action appropriate to the recipe's current state: `Mark as core` for a trial
recipe that's proven itself, `Retire` for a core recipe that's fallen out of
rotation. This is the signature element (see §5).

### 3c. Home / empty states

Reference 2's "pick up where you left off" card and category-icon row are
good instincts but the wrong content for a single-user tracker. Replace with:

- A **"needs a decision" nudge** at the top of Home when the trial pile has
  ≥3 items and none have been promoted/retired in 2+ weeks — this directly
  serves "avoid decision fatigue," the stated goal, rather than a generic
  continue-watching pattern.
- Category icons (breakfast/lunch/dinner/snack) stay as a secondary filter row,
  styled per reference 2 (soft pastel circle backgrounds), but demoted below
  the status tabs, not above them.

## 4. Components

| Component | Spec |
|---|---|
| Status badge | Pill, uppercase, 0.68rem, bold. `core` = green-soft bg / green text. `trial` = trial-soft bg / trial text. `retired` = border-gray bg / muted text. |
| Macro box | Bordered rounded rect (`--border`, 10px radius), value in `--accent` bold serif-adjacent numeral, label uppercase `--muted` beneath. Row of 4, equal width, wraps to 2×2 on narrow phones. |
| Ingredient row | Thumbnail-less on mobile (icon only) to save width; tag chips (Protein/Carb/Fat) inherited from reference 1, colored by macro type not randomly. |
| Primary CTA | Full-width pill, `--text` bg / white label by default; on hover/press shifts to `--accent`. Label is always a status verb (Mark as core / Retire / Move to trial), never generic ("Save", "Submit"). |
| Tab row | Underline-style or filled-pill (match existing sidebar's filled-active pattern) — active tab uses `--text` fill, not `--accent`, so the accent color stays reserved for macros and primary actions only. |

## 5. Signature element

**The status ribbon.** Every recipe card and detail view carries a thin
1px-wide colored edge (left border on list rows, top border on detail sheets)
in green/amber/gray matching core/trial/retired — visible at a glance even
before reading the badge text. Scrolling the list, the eye reads a strip of
color down the left edge that tells you, without reading a word, how much of
your rotation is still "proven" vs. "unproven." This is the one place the app
takes a small typographic/graphic risk (references 1–4 all use flat white
cards with no status signal at all) and it directly encodes the real structure
of the data — not decoration.

## 6. What was deliberately left out

- No star ratings (reference 1 & 2) — this is a single-user tool, a personal
  rating scale of "core/trial/retired" already exists and is more useful.
- No calorie/protein/price-per-serving stat pills styled as marketing badges
  (reference 3) — macros live in the stat-box row on detail view instead,
  where they're structurally part of the data, not a merchandising tag.
- No poster-style numbered cards or two-column print layout (reference 4) —
  right for a printable card deck, wrong for a phone PWA that needs to be
  scannable one-handed.
- No bottom tab bar with Explore/Favorites/Profile (reference 2) — there's one
  user and no social feature set; the sidebar nav already in `index.html`
  (Core / Trial / Retired / Ingredients) covers it.

## 7. Open questions before implementation

- Should recipe photos be required, or is an icon/emoji placeholder acceptable
  for trial recipes that don't have a photo yet? (Reference 1 always shows a
  thumbnail; this tracker likely won't have photos for every entry.)
- Confirm whether the "needs a decision" nudge (§3c) should be time-based
  (2 weeks untouched) or count-based (≥3 trial items) — spec assumes both as
  an AND condition but this hasn't been validated against real usage yet.
