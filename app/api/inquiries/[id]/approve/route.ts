// POST: donator approves an inquiry
// - verify caller owns the item this inquiry belongs to
// - set this inquiry -> approved, all other pending inquiries on same item -> closed
// - set item.status -> reserved
// See SYSTEM.md §5 and §6
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
    .select("id, item_id, status, items(donator_id, status)")
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

  if (inquiry.items?.status !== "available") {
    return NextResponse.json(
      { error: "This item is no longer available." },
      { status: 400 }
    );
  }

  const { error: approveError } = await admin
    .from("inquiries")
    .update({ status: "approved" })
    .eq("id", inquiryId);

  if (approveError) {
    return NextResponse.json({ error: approveError.message }, { status: 500 });
  }

  const { error: closeError } = await admin
    .from("inquiries")
    .update({ status: "closed" })
    .eq("item_id", inquiry.item_id)
    .eq("status", "pending");

  if (closeError) {
    return NextResponse.json({ error: closeError.message }, { status: 500 });
  }

  const { error: itemError } = await admin
    .from("items")
    .update({ status: "reserved" })
    .eq("id", inquiry.item_id);

  if (itemError) {
    return NextResponse.json({ error: itemError.message }, { status: 500 });
  }

  return NextResponse.json({ status: "approved" });
}
