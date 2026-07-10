<<<<<<< HEAD
// Browser Supabase client (anon key) — for use in Client Components ("use client")
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
=======
// Browser Supabase client (anon key)
>>>>>>> c98a9489027454d730cce406f24e65d63b986d31
