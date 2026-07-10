import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Not covered by middleware's admin gate (only matches /admin/*, not
// /api/admin/*) — this route re-checks is_admin itself.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: itemId } = await params;

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

  const { data: item, error: fetchError } = await admin
    .from("items")
    .select("id, removed_by_admin")
    .eq("id", itemId)
    .single();

  if (fetchError || !item) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  const nextRemoved = !item.removed_by_admin;

  const { error: updateError } = await admin
    .from("items")
    .update({ removed_by_admin: nextRemoved })
    .eq("id", itemId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ removedByAdmin: nextRemoved });
}
