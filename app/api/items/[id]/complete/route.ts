// POST: donator marks item -> completed (terminal state)
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const admin = createAdminClient();

  const { data: item, error: fetchError } = await admin
    .from("items")
    .select("id, donator_id, status")
    .eq("id", itemId)
    .single();

  if (fetchError || !item) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  if (item.donator_id !== user.id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  if (item.status !== "reserved") {
    return NextResponse.json(
      { error: "Only reserved items can be marked as given away." },
      { status: 400 }
    );
  }

  const { error: updateError } = await admin
    .from("items")
    .update({ status: "completed" })
    .eq("id", itemId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ status: "completed" });
}
