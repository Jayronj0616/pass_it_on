// Service-role Supabase client — deliberately bypasses RLS. Only import
// this inside API routes that need it on purpose: inquiry approve/reject,
// the item-complete route, the contact-reveal route, and the admin/* routes
// (SYSTEM.md §6 and §9). Never import this in a Server/Client Component or
// anywhere the user's own request context should be respected instead —
// use lib/supabase/server.ts or client.ts for that.
//
// SUPABASE_SERVICE_ROLE_KEY must be set in .env.local and must NOT be
// prefixed with NEXT_PUBLIC_ — that prefix ships the value to the browser.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
