// POST: donator rejects a single inquiry -> status 'rejected'
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const admin = createAdminClient();

  const { data: inquiry, error: fetchError } = await admin
    .from("inquiries")
    .select("id, status, items(donator_id)")
    .eq("id", inquiryId)
    .single();

  if (fetchError || !inquiry) {
    return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
  }

  if (inquiry.items?.donator_id !== user.id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  if (inquiry.status !== "pending") {
    return NextResponse.json(
      { error: "This inquiry is no longer pending." },
      { status: 400 }
    );
  }

  const { error: updateError } = await admin
    .from("inquiries")
    .update({ status: "rejected" })
    .eq("id", inquiryId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ status: "rejected" });
}
