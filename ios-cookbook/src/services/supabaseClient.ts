import { createClient } from '@supabase/supabase-js';

// Public-safe Supabase project URL + anon/publishable key for the
// "Cookbook" project. Hardcoded intentionally: Cloudflare Pages env vars
// (Variables/Secrets) are only injected into server-side Pages Functions,
// not into static client-side JS at runtime, and this app talks to
// Supabase directly from the browser with no server-side proxy. The anon
// key is designed by Supabase to be safe to expose client-side — it can
// only do what the (currently permissive, no-RLS) table policies allow.
export const SUPABASE_URL = 'https://cltgikwupboixwmmrqke.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_aPZGR_GPtah1Wy_endlz-Q_66gnqk7t';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
