<<<<<<< HEAD
// Server-side Supabase client (anon key + user's session cookies) — for use
// in Server Components and regular page data fetching. Respects RLS as the
// logged-in user, same as the browser client, just usable on the server.
//
// This is NOT the service-role client. For API routes that need to bypass
// RLS on purpose (approve/reject/contact/complete, admin routes — see
// SYSTEM.md §6 and §9), use lib/supabase/admin.ts instead.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — safe to ignore since
            // middleware handles session refresh on the request/response.
          }
        },
      },
    }
  );
}
=======
// Server Supabase client for use in API routes (service role key — server-only, never exposed to client)
>>>>>>> c98a9489027454d730cce406f24e65d63b986d31
