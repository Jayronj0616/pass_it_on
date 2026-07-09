"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DashboardItemCard,
  type DashboardItem,
} from "@/components/dashboard/DashboardItemCard";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

// Placeholder data — replace with a Supabase query once the DB is wired up.
// select items.*, inquiries.* from items left join inquiries on inquiries.item_id = items.id
// where items.donator_id = auth.uid()
const INITIAL_ITEMS: DashboardItem[] = [
  {
    id: "1",
    title: "Oak bookshelf, 5 shelves",
    photoUrl: null,
    status: "available",
    inquiries: [
      {
        id: "i1",
        receiverName: "Jordan P.",
        message: "I could really use this for my new apartment, can pick up anytime this week.",
        status: "pending",
        sentAt: "2 hours ago",
      },
      {
        id: "i2",
        receiverName: "Sam R.",
        message: "Would love this for my home office!",
        status: "pending",
        sentAt: "5 hours ago",
      },
      {
        id: "i3",
        receiverName: "Casey L.",
        message: "",
        status: "pending",
        sentAt: "1 day ago",
      },
    ],
  },
  {
    id: "2",
    title: "Box of kids' picture books",
    photoUrl: null,
    status: "reserved",
    inquiries: [
      {
        id: "i4",
        receiverName: "Alex M.",
        message: "My daughter would love these.",
        status: "approved",
        sentAt: "3 days ago",
      },
      {
        id: "i5",
        receiverName: "Taylor B.",
        message: "For my classroom library.",
        status: "closed",
        sentAt: "3 days ago",
      },
    ],
  },
  {
    id: "3",
    title: "Standing desk frame",
    photoUrl: null,
    status: "completed",
    inquiries: [
      {
        id: "i6",
        receiverName: "Morgan K.",
        message: "",
        status: "approved",
        sentAt: "2 weeks ago",
      },
    ],
  },
];

type PendingAction =
  | { type: "approve"; itemId: string; inquiryId: string; receiverName: string }
  | { type: "reject"; itemId: string; inquiryId: string; receiverName: string }
  | { type: "complete"; itemId: string; itemTitle: string };

export default function MyItemsDashboardPage() {
  const [items, setItems] = useState<DashboardItem[]>(INITIAL_ITEMS);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [working, setWorking] = useState(false);

  function handleApprove(itemId: string, inquiryId: string) {
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

  function handleReject(itemId: string, inquiryId: string) {
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

  function handleMarkComplete(itemId: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, status: "completed" as const } : item,
      ),
    );
  }

  function runPendingAction() {
    if (!pendingAction) return;
    setWorking(true);
    // Placeholder for a real request round-trip — replace with the actual
    // API calls (approve/reject/complete routes) once backend is wired up.
    setTimeout(() => {
      if (pendingAction.type === "approve") {
        handleApprove(pendingAction.itemId, pendingAction.inquiryId);
      } else if (pendingAction.type === "reject") {
        handleReject(pendingAction.itemId, pendingAction.inquiryId);
      } else {
        handleMarkComplete(pendingAction.itemId);
      }
      setWorking(false);
      setPendingAction(null);
    }, 300);
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
