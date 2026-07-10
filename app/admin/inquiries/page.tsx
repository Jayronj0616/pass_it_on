import { createAdminClient } from "@/lib/supabase/admin";
import { formatRelativeTime } from "@/lib/utils/format";
import { InquiriesPageClient } from "./InquiriesPageClient";
import type { AdminInquiry } from "@/components/admin/InquiriesTable";

export default async function AdminInquiriesPage() {
  const admin = createAdminClient();

  const { data: rows } = await admin
    .from("inquiries")
    .select(
      "id, item_id, status, created_at, receiver:profiles(display_name), items(title, donator:profiles(display_name))"
    )
    .order("created_at", { ascending: false });

  const inquiries: AdminInquiry[] = (rows ?? []).map((row) => ({
    id: row.id,
    itemId: row.item_id,
    itemTitle: row.items?.title ?? "Unknown item",
    receiverName: row.receiver?.display_name ?? "Unknown",
    donatorName: row.items?.donator?.display_name ?? "Unknown",
    status: row.status,
    sentAt: formatRelativeTime(row.created_at),
  }));

  return <InquiriesPageClient initialInquiries={inquiries} />;
}
