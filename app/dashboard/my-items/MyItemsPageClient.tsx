"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DashboardItemCard,
  type DashboardItem,
} from "@/components/dashboard/DashboardItemCard";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type PendingAction =
  | { type: "approve"; itemId: string; inquiryId: string; receiverName: string }
  | { type: "reject"; itemId: string; inquiryId: string; receiverName: string }
  | { type: "complete"; itemId: string; itemTitle: string };

export function MyItemsPageClient({
  initialItems,
}: {
  initialItems: DashboardItem[];
}) {
  const [items, setItems] = useState<DashboardItem[]>(initialItems);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyApprove(itemId: string, inquiryId: string) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          status: "reserved",
          inquiries: item.inquiries.map((inq) =>
            inq.id === inquiryId
              ? { ...inq, status: "approved" as const }
              : inq.status === "pending"
                ? { ...inq, status: "closed" as const }
                : inq,
          ),
        };
      }),
    );
  }

  function applyReject(itemId: string, inquiryId: string) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          inquiries: item.inquiries.map((inq) =>
            inq.id === inquiryId
              ? { ...inq, status: "rejected" as const }
              : inq,
          ),
        };
      }),
    );
  }

  function applyComplete(itemId: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, status: "completed" as const } : item,
      ),
    );
  }

  async function runPendingAction() {
    if (!pendingAction) return;
    setWorking(true);
    setError(null);

    let res: Response;

    if (pendingAction.type === "approve") {
      res = await fetch(`/api/inquiries/${pendingAction.inquiryId}/approve`, {
        method: "POST",
      });
    } else if (pendingAction.type === "reject") {
      res = await fetch(`/api/inquiries/${pendingAction.inquiryId}/reject`, {
        method: "POST",
      });
    } else {
      res = await fetch(`/api/items/${pendingAction.itemId}/complete`, {
        method: "POST",
      });
    }

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Something went wrong. Try again.");
      setWorking(false);
      return;
    }

    if (pendingAction.type === "approve") {
      applyApprove(pendingAction.itemId, pendingAction.inquiryId);
    } else if (pendingAction.type === "reject") {
      applyReject(pendingAction.itemId, pendingAction.inquiryId);
    } else {
      applyComplete(pendingAction.itemId);
    }

    setWorking(false);
    setPendingAction(null);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-ink">
            PassItOn
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/my-inquiries" className="text-sm font-semibold text-muted hover:text-ink">
              My inquiries
            </Link>
            <Link href="/profile" className="text-sm font-semibold text-muted hover:text-ink">
              Profile
            </Link>
            <Link
              href="/items/new"
              className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
            >
              Post an item
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-extrabold text-ink">Your items</h1>
        <p className="mt-1 text-sm text-muted">
          Review inquiries and choose who gets each item.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {items.map((item) => (
              <DashboardItemCard
                key={item.id}
                item={item}
                onApproveInquiry={(inquiryId) => {
                  const inquiry = item.inquiries.find((i) => i.id === inquiryId);
                  setPendingAction({
                    type: "approve",
                    itemId: item.id,
                    inquiryId,
                    receiverName: inquiry?.receiverName ?? "this receiver",
                  });
                }}
                onRejectInquiry={(inquiryId) => {
                  const inquiry = item.inquiries.find((i) => i.id === inquiryId);
                  setPendingAction({
                    type: "reject",
                    itemId: item.id,
                    inquiryId,
                    receiverName: inquiry?.receiverName ?? "this receiver",
                  });
                }}
                onMarkComplete={() =>
                  setPendingAction({
                    type: "complete",
                    itemId: item.id,
                    itemTitle: item.title,
                  })
                }
              />
            ))}
          </div>
        )}
      </main>

      <ConfirmModal
        isOpen={pendingAction !== null}
        pending={working}
        onCancel={() => setPendingAction(null)}
        onConfirm={runPendingAction}
        title={
          pendingAction?.type === "approve"
            ? "Approve this inquiry?"
            : pendingAction?.type === "reject"
              ? "Decline this inquiry?"
              : "Mark as given away?"
        }
        description={
          pendingAction?.type === "approve"
            ? `${pendingAction.receiverName} will get your contact info, and all other pending inquiries on this item will be closed automatically.`
            : pendingAction?.type === "reject"
              ? `${pendingAction.receiverName} will see their inquiry was declined. This can't be undone.`
              : "This item moves to your completed history and can no longer be inquired about."
        }
        confirmLabel={
          pendingAction?.type === "approve"
            ? "Approve"
            : pendingAction?.type === "reject"
              ? "Decline"
              : "Mark complete"
        }
        tone={pendingAction?.type === "reject" ? "danger" : "default"}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card-shadow mt-6 flex flex-col items-center justify-center rounded-2xl border border-border bg-surface py-24 text-center">
      <p className="text-xl font-bold text-ink">Nothing posted yet</p>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Post an item and inquiries will show up here for you to review.
      </p>
      <Link
        href="/items/new"
        className="mt-6 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
      >
        Post an item
      </Link>
    </div>
  );
}
