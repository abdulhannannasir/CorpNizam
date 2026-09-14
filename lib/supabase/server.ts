import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_KEY } from "./env";

/**
 * Server-side Supabase client bound to the request's auth cookies.
 * Every query made with this client is subject to Postgres RLS for the
 * authenticated user — it never uses the service-role key.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component without a mutable response —
          // safe to ignore because middleware refreshes the session cookie.
        }
      },
    },
  });
}
