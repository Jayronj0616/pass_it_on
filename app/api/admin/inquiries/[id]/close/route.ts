import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Not covered by middleware's admin gate (only matches /admin/*, not
// /api/admin/*) — this route re-checks is_admin itself.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: inquiryId } = await params;

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

  const { data: inquiry, error: fetchError } = await admin
    .from("inquiries")
    .select("id, status")
    .eq("id", inquiryId)
    .single();

  if (fetchError || !inquiry) {
    return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
  }

  if (inquiry.status === "closed" || inquiry.status === "rejected") {
    return NextResponse.json(
      { error: "This inquiry is already closed." },
      { status: 400 }
    );
  }

  const { error: updateError } = await admin
    .from("inquiries")
    .update({ status: "closed" })
    .eq("id", inquiryId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ status: "closed" });
}
