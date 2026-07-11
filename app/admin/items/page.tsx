import { createAdminClient } from "@/lib/supabase/admin";
import { formatRelativeTime } from "@/lib/utils/format";
import { asItemStatus } from "@/lib/utils/status";
import { ItemsPageClient } from "./ItemsPageClient";
import type { AdminItem } from "@/components/admin/ItemsTable";

export default async function AdminItemsPage() {
  const admin = createAdminClient();

  const { data: rows } = await admin
    .from("items")
    .select(
      "id, title, status, removed_by_admin, inquiry_count, created_at, profiles(display_name)"
    )
    .order("created_at", { ascending: false });

  const items: AdminItem[] = (rows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    donatorName: row.profiles?.display_name ?? "Unknown",
    status: asItemStatus(row.status),
    removedByAdmin: row.removed_by_admin,
    inquiryCount: row.inquiry_count,
    createdAt: formatRelativeTime(row.created_at),
  }));

  return <ItemsPageClient initialItems={items} />;
}
