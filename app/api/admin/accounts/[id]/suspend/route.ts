import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Not covered by middleware's admin gate — that only matches routes
// starting with /admin, not /api/admin — so this route re-checks is_admin
// itself. Don't remove this check assuming middleware already handled it.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetId } = await params;

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

  const { data: targetProfile, error: fetchError } = await admin
    .from("profiles")
    .select("id, is_admin, suspended")
    .eq("id", targetId)
    .single();

  if (fetchError || !targetProfile) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  if (targetProfile.is_admin) {
    return NextResponse.json(
      { error: "Admin accounts can't be suspended from this panel." },
      { status: 400 }
    );
  }

  const nextSuspended = !targetProfile.suspended;

  const { error: updateError } = await admin
    .from("profiles")
    .update({ suspended: nextSuspended })
    .eq("id", targetId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ suspended: nextSuspended });
}
