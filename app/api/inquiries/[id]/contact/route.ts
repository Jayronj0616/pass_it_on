// GET: return donator contact info IF caller is the approved receiver on this inquiry
// Do NOT expose profiles.email/phone via RLS SELECT — enforce here server-side.
// See SYSTEM.md §5 for why.
//
// Uses the regular (non-admin) server client on purpose: get_donator_contact
// is security definer and checks auth.uid() against the inquiry's
// receiver_id + approved status itself, so no separate ownership check is
// needed here — the function IS the check.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
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

  const { data, error } = await supabase
    .rpc("get_donator_contact", { inquiry_id: inquiryId })
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Contact info isn't available for this inquiry." },
      { status: 403 }
    );
  }

  return NextResponse.json({ email: data.email, phone: data.phone });
}
