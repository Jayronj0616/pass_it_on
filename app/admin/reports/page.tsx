import { createAdminClient } from "@/lib/supabase/admin";
import { formatRelativeTime } from "@/lib/utils/format";
import { ReportsPageClient } from "./ReportsPageClient";
import type { AdminReport } from "@/components/admin/ReportsTable";

export default async function AdminReportsPage() {
  const admin = createAdminClient();

  const { data: rows } = await admin
    .from("reports")
    .select(
      "id, item_id, reason, note, status, created_at, reporter:profiles(display_name), items(title)"
    )
    .order("status", { ascending: true }) // open before resolved
    .order("created_at", { ascending: false });

  const reports: AdminReport[] = (rows ?? []).map((row) => ({
    id: row.id,
    itemId: row.item_id,
    itemTitle: row.items?.title ?? "Unknown item",
    reporterName: row.reporter?.display_name ?? "Unknown",
    reason: row.reason,
    note: row.note,
    status: row.status,
    reportedAt: formatRelativeTime(row.created_at),
  }));

  return <ReportsPageClient initialReports={reports} />;
}
