import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeTime } from "@/lib/utils/format";
import { asItemStatus, asInquiryStatus } from "@/lib/utils/status";
import {
  MyInquiryCard,
  type MyInquiryData,
} from "@/components/dashboard/MyInquiryCard";

export default async function MyInquiriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: rows } = await supabase
    .from("inquiries")
    .select("id, item_id, status, created_at, items(title, photo_url, status)")
    .eq("receiver_id", user.id)
    .order("created_at", { ascending: false });

  const approvedIds = (rows ?? [])
    .filter((r) => r.status === "approved")
    .map((r) => r.id);

  const contactById = new Map<string, { email: string; phone: string | null }>();

  await Promise.all(
    approvedIds.map(async (inquiryId) => {
      const { data } = await supabase
        .rpc("get_donator_contact", { inquiry_id: inquiryId })
        .single();
      if (data) {
        contactById.set(inquiryId, { email: data.email, phone: data.phone });
      }
    }),
  );

  const inquiries: MyInquiryData[] = (rows ?? []).map((row) => ({
    id: row.id,
    itemId: row.item_id,
    itemTitle: row.items?.title ?? "Unknown item",
    itemPhotoUrl: row.items?.photo_url ?? null,
    itemStatus: asItemStatus(row.items?.status ?? "available"),
    status: asInquiryStatus(row.status),
    sentAt: formatRelativeTime(row.created_at),
    contact: contactById.get(row.id),
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-extrabold text-ink">Your inquiries</h1>
        <p className="mt-1 text-sm text-muted">
          Track what you&apos;ve asked for and see contact info once a
          donator approves you.
        </p>

        {inquiries.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {inquiries.map((inquiry) => (
              <MyInquiryCard key={inquiry.id} inquiry={inquiry} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card-shadow mt-6 flex flex-col items-center justify-center rounded-2xl border border-border bg-surface py-24 text-center">
      <p className="text-xl font-bold text-ink">No inquiries yet</p>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Browse items and send an inquiry when you find something you need.
      </p>
      <Link
        href="/browse"
        className="mt-6 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
      >
        Browse items
      </Link>
    </div>
  );
}
