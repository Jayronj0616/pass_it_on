// POST: checks + records an IP-based signup rate limit (5/hour, see
// 0014_signup_rate_limit.sql). Called by app/signup/page.tsx right before
// supabase.auth.signUp() — kept as a server route rather than a
// browser-callable RPC because the IP has to come from a trusted server
// read of request headers, not a value the client could self-report.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const admin = createAdminClient();
  const { data: allowed, error } = await admin.rpc(
    "check_and_record_signup_attempt",
    { p_ip: ip }
  );

  // Fail open on an unexpected DB error — same reasoning as the login
  // lock-check (SYSTEM.md §17): don't block a legitimate signup over an
  // unrelated failure.
  if (error) {
    return NextResponse.json({ allowed: true });
  }

  return NextResponse.json({ allowed });
}
