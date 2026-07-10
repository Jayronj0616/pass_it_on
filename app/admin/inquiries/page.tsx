<<<<<<< HEAD
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
=======
"use client";

import { useState } from "react";
import { InquiriesTable, type AdminInquiry } from "@/components/admin/InquiriesTable";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

// Placeholder data — replace with: select *, items.title, receiver profile, donator profile
// from inquiries join items ... join profiles (receiver) ... join profiles (donator)
const INITIAL_INQUIRIES: AdminInquiry[] = [
  {
    id: "i1",
    itemId: "1",
    itemTitle: "Oak bookshelf, 5 shelves",
    receiverName: "Jordan P.",
    donatorName: "Mira T.",
    status: "pending",
    sentAt: "2 hours ago",
  },
  {
    id: "i2",
    itemId: "1",
    itemTitle: "Oak bookshelf, 5 shelves",
    receiverName: "Sam R.",
    donatorName: "Mira T.",
    status: "pending",
    sentAt: "5 hours ago",
  },
  {
    id: "i3",
    itemId: "2",
    itemTitle: "Box of kids' picture books",
    receiverName: "Alex M.",
    donatorName: "Mira T.",
    status: "approved",
    sentAt: "3 days ago",
  },
  {
    id: "i4",
    itemId: "2",
    itemTitle: "Box of kids' picture books",
    receiverName: "Taylor B.",
    donatorName: "Mira T.",
    status: "closed",
    sentAt: "3 days ago",
  },
  {
    id: "i5",
    itemId: "4",
    itemTitle: "Ceramic plant pots (set of 3)",
    receiverName: "Casey L.",
    donatorName: "Jordan P.",
    status: "rejected",
    sentAt: "1 week ago",
  },
];

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<AdminInquiry[]>(INITIAL_INQUIRIES);
  const [pendingInquiry, setPendingInquiry] = useState<AdminInquiry | null>(null);
  const [working, setWorking] = useState(false);

  function runForceClose() {
    if (!pendingInquiry) return;
    setWorking(true);
    // Placeholder — replace with an update to inquiries.status = 'closed' via
    // a server route gated on caller.is_admin. Used for abuse/dispute cases
    // outside the normal single-approval-closes-siblings flow.
    setTimeout(() => {
      setInquiries((prev) =>
        prev.map((inquiry) =>
          inquiry.id === pendingInquiry.id
            ? { ...inquiry, status: "closed" as const }
            : inquiry,
        ),
      );
      setWorking(false);
      setPendingInquiry(null);
    }, 300);
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Inquiries</h1>
      <p className="mt-1 text-sm text-muted">
        Every inquiry across every item. Force-closing is for disputes or
        abuse — it doesn&apos;t change the item&apos;s status.
      </p>

      <div className="mt-6">
        <InquiriesTable
          inquiries={inquiries}
          onForceClose={(id) => {
            const inquiry = inquiries.find((i) => i.id === id);
            if (inquiry) setPendingInquiry(inquiry);
          }}
        />
      </div>

      <ConfirmModal
        isOpen={pendingInquiry !== null}
        pending={working}
        onCancel={() => setPendingInquiry(null)}
        onConfirm={runForceClose}
        title="Force-close this inquiry?"
        description={`This closes ${pendingInquiry?.receiverName}'s inquiry on "${pendingInquiry?.itemTitle}" regardless of its current status. Use this for disputes or abuse, not routine review.`}
        confirmLabel="Force close"
        tone="danger"
      />
    </div>
  );
>>>>>>> c98a9489027454d730cce406f24e65d63b986d31
}
