/**
 * Supabase now issues "publishable" keys (`sb_publishable_...`) in place of
 * the older anon JWT. Both are safe to expose to the browser and both work
 * as the second argument to createBrowserClient/createServerClient, so we
 * accept either env var name — new projects set the publishable key, older
 * ones may still have NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
