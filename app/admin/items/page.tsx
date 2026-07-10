<<<<<<< HEAD
import { createAdminClient } from "@/lib/supabase/admin";
import { formatRelativeTime } from "@/lib/utils/format";
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
    status: row.status,
    removedByAdmin: row.removed_by_admin,
    inquiryCount: row.inquiry_count,
    createdAt: formatRelativeTime(row.created_at),
  }));

  return <ItemsPageClient initialItems={items} />;
=======
"use client";

import { useState } from "react";
import { ItemsTable, type AdminItem } from "@/components/admin/ItemsTable";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

// Placeholder data — replace with: select *, profiles.display_name, count(inquiries) from items
// join profiles on items.donator_id = profiles.id
const INITIAL_ITEMS: AdminItem[] = [
  {
    id: "1",
    title: "Oak bookshelf, 5 shelves",
    donatorName: "Mira T.",
    status: "available",
    removedByAdmin: false,
    inquiryCount: 3,
    createdAt: "3 days ago",
  },
  {
    id: "2",
    title: "Box of kids' picture books",
    donatorName: "Mira T.",
    status: "reserved",
    removedByAdmin: false,
    inquiryCount: 5,
    createdAt: "1 week ago",
  },
  {
    id: "3",
    title: "Standing desk frame",
    donatorName: "Casey L.",
    status: "completed",
    removedByAdmin: false,
    inquiryCount: 1,
    createdAt: "2 weeks ago",
  },
  {
    id: "4",
    title: "Ceramic plant pots (set of 3)",
    donatorName: "Jordan P.",
    status: "available",
    removedByAdmin: false,
    inquiryCount: 0,
    createdAt: "1 week ago",
  },
  {
    id: "5",
    title: "Free firewood, self-haul",
    donatorName: "Sam R.",
    status: "available",
    removedByAdmin: true,
    inquiryCount: 2,
    createdAt: "10 days ago",
  },
];

export default function AdminItemsPage() {
  const [items, setItems] = useState<AdminItem[]>(INITIAL_ITEMS);
  const [pendingItem, setPendingItem] = useState<AdminItem | null>(null);
  const [working, setWorking] = useState(false);

  function runToggleRemoved() {
    if (!pendingItem) return;
    setWorking(true);
    // Placeholder — replace with an update to items.removed_by_admin via a
    // server route gated on caller.is_admin. A removed item stays in the DB
    // for history/audit but drops out of public browse regardless of status.
    setTimeout(() => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === pendingItem.id
            ? { ...item, removedByAdmin: !item.removedByAdmin }
            : item,
        ),
      );
      setWorking(false);
      setPendingItem(null);
    }, 300);
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Items</h1>
      <p className="mt-1 text-sm text-muted">
        Every listing on the platform, regardless of status. Removing an item
        hides it from public browse but keeps the record.
      </p>

      <div className="mt-6">
        <ItemsTable
          items={items}
          onToggleRemoved={(id) => {
            const item = items.find((i) => i.id === id);
            if (item) setPendingItem(item);
          }}
        />
      </div>

      <ConfirmModal
        isOpen={pendingItem !== null}
        pending={working}
        onCancel={() => setPendingItem(null)}
        onConfirm={runToggleRemoved}
        title={
          pendingItem?.removedByAdmin
            ? `Restore "${pendingItem?.title}"?`
            : `Remove "${pendingItem?.title}"?`
        }
        description={
          pendingItem?.removedByAdmin
            ? "This item becomes visible in public browse again, if its status still allows it."
            : "This item disappears from public browse immediately. The listing and its history are kept, not deleted."
        }
        confirmLabel={pendingItem?.removedByAdmin ? "Restore" : "Remove"}
        tone={pendingItem?.removedByAdmin ? "default" : "danger"}
      />
    </div>
  );
>>>>>>> c98a9489027454d730cce406f24e65d63b986d31
}
