"use client";

import { useState } from "react";
import { InquiriesTable, type AdminInquiry } from "@/components/admin/InquiriesTable";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function InquiriesPageClient({
  initialInquiries,
}: {
  initialInquiries: AdminInquiry[];
}) {
  const [inquiries, setInquiries] = useState<AdminInquiry[]>(initialInquiries);
  const [pendingInquiry, setPendingInquiry] = useState<AdminInquiry | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runForceClose() {
    if (!pendingInquiry) return;
    setWorking(true);
    setError(null);

    const res = await fetch(`/api/admin/inquiries/${pendingInquiry.id}/close`, {
      method: "POST",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Something went wrong. Try again.");
      setWorking(false);
      return;
    }

    setInquiries((prev) =>
      prev.map((inquiry) =>
        inquiry.id === pendingInquiry.id
          ? { ...inquiry, status: "closed" as const }
          : inquiry
      )
    );
    setWorking(false);
    setPendingInquiry(null);
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Inquiries</h1>
      <p className="mt-1 text-sm text-muted">
        Every inquiry across every item. Force-closing is for disputes or
        abuse — it doesn&apos;t change the item&apos;s status.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

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
}
