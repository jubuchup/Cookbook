# Cookbook (ios-cookbook)

An iOS native-feel PWA cookbook: recipe list with filters, favorites,
macros & kcal breakdown, dynamic serving scaler, a fridge/pantry ingredient
matcher, and a step-by-step cooking mode with timers.

Data lives in Supabase (see `../docs/supabase-schema-migration.sql` and
`src/services/supabaseClient.ts` / `src/services/recipeApi.ts`) — the app
talks to Supabase directly from the browser, no backend server.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Run the dev server:
   `npm run dev`
3. Build for production:
   `npm run build` (outputs to `dist/`, which is what Cloudflare Pages
   serves)
