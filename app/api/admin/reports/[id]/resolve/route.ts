import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Not covered by middleware's admin gate (only matches /admin/*, not
// /api/admin/*) — this route re-checks is_admin itself, same as the other
// /api/admin/* routes.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!callerProfile?.is_admin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: report, error: fetchError } = await admin
    .from("reports")
    .select("id, status")
    .eq("id", reportId)
    .single();

  if (fetchError || !report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  if (report.status === "resolved") {
    return NextResponse.json(
      { error: "This report is already resolved." },
      { status: 400 }
    );
  }

  const { error: updateError } = await admin
    .from("reports")
    .update({ status: "resolved" })
    .eq("id", reportId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ status: "resolved" });
}
