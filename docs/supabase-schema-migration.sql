-- Cookbook Supabase schema migration
-- Extends the existing `recipes` table (created per cookbook-app-handoff.md)
-- so it can hold everything the ios-cookbook UI needs: meal-type filters,
-- favorites, tags, structured ingredients/steps (for the fridge matcher and
-- cooking-mode timers), and a photo.
--
-- Run this once in the Supabase SQL editor. Table is currently empty, so
-- this is safe to run directly (no data migration needed).
--
-- Design notes (why reuse vs. add):
--   - `name`     is reused as the recipe title (Recipe.title).
--   - `category` is reused as meal type (Breakfast/Lunch/Dinner/Snack/Dessert).
--   - `prep_time` (free text) is superseded by new prep_time_minutes /
--     cook_time_minutes integer columns; left in place but unused so no
--     column is dropped.
--   - `ingredients` / `steps` change from freeform text to jsonb so the app
--     can store/read structured arrays (id/name/amount/unit/category/notes
--     for ingredients; stepNumber/title/instruction/durationMinutes/tip for
--     steps). This is exactly what the original column comment
--     ("freeform for now, can normalize later") anticipated.
--   - `total_kcal`/`total_protein`/`total_carbs`/`total_fat` are reused as
--     Recipe.calories / macros.protein / macros.carbs / macros.fat.
--   - `owner_email` / `visibility` / RLS are untouched — still deferred
--     per the handoff doc.

alter table recipes
  add column if not exists description text,
  add column if not exists image_url text,
  add column if not exists difficulty text,               -- 'Easy' | 'Medium' | 'Hard'
  add column if not exists prep_time_minutes int,
  add column if not exists cook_time_minutes int,
  add column if not exists fiber numeric,
  add column if not exists tags text[] default '{}',
  add column if not exists is_favorite boolean default false;

-- Convert freeform text columns to jsonb (table is empty, safe cast).
alter table recipes
  alter column ingredients type jsonb using
    case when ingredients is null or ingredients = '' then '[]'::jsonb
         else ingredients::jsonb end,
  alter column ingredients set default '[]'::jsonb;

alter table recipes
  alter column steps type jsonb using
    case when steps is null or steps = '' then '[]'::jsonb
         else steps::jsonb end,
  alter column steps set default '[]'::jsonb;

-- Still no RLS enabled on purpose — public read/write during testing phase.
