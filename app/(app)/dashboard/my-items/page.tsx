import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeTime } from "@/lib/utils/format";
import { asItemStatus, asInquiryStatus } from "@/lib/utils/status";
import { MyItemsPageClient } from "./MyItemsPageClient";
import type { DashboardItem } from "@/components/dashboard/DashboardItemCard";

export default async function MyItemsDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: rows } = await supabase
    .from("items")
    .select("id, title, photo_url, status, created_at")
    .eq("donator_id", user.id)
    .order("created_at", { ascending: false });

  const itemIds = (rows ?? []).map((r) => r.id);

  const { data: inquiryRows } = itemIds.length
    ? await supabase
        .from("inquiries")
        .select("id, item_id, receiver_id, message, status, created_at")
        .in("item_id", itemIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const receiverIds = [
    ...new Set((inquiryRows ?? []).map((i) => i.receiver_id)),
  ];

  const { data: receiverProfiles } = receiverIds.length
    ? await supabase
        .from("public_profiles")
        .select("id, display_name")
        .in("id", receiverIds)
    : { data: [] };

  const nameById = new Map(
    (receiverProfiles ?? []).map((p) => [p.id, p.display_name])
  );

  const items: DashboardItem[] = (rows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    photoUrl: row.photo_url,
    status: asItemStatus(row.status),
    inquiries: (inquiryRows ?? [])
      .filter((inq) => inq.item_id === row.id)
      .map((inq) => ({
        id: inq.id,
        receiverName: nameById.get(inq.receiver_id) ?? "Unknown",
        message: inq.message ?? "",
        status: asInquiryStatus(inq.status),
        sentAt: formatRelativeTime(inq.created_at),
      })),
  }));

  return <MyItemsPageClient initialItems={items} />;
}
