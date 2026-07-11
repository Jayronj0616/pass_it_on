"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { StatusTag } from "@/components/items/StatusTag";
import { InquiryModal } from "@/components/inquiries/InquiryModal";
import { ReportItemModal } from "@/components/items/ReportItemModal";
import { createClient } from "@/lib/supabase/client";

type Item = {
  id: string;
  title: string;
  description: string;
  photoUrl: string | null;
  status: "available" | "reserved" | "completed";
  inquiryCount: number;
  donatorName: string;
  postedAt: string;
};

export function ItemDetailClient({
  item,
  userId,
  isAdmin,
}: {
  item: Item;
  userId: string | null;
  isAdmin: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const isLoggedIn = userId !== null;

  const canInquire = item.status === "available";

  async function handleInquirySubmit(message: string) {
    if (!userId) {
      return { ok: false, error: "You need to be logged in to inquire." };
    }

    const supabase = createClient();
    const { error } = await supabase.from("inquiries").insert({
      item_id: item.id,
      receiver_id: userId,
      message: message.trim() || null,
    });

    if (error) {
      // unique(item_id, receiver_id) violation — friendlier message than the raw DB error
      if (error.code === "23505") {
        return { ok: false, error: "You've already inquired about this item." };
      }
      return { ok: false, error: error.message };
    }

    return { ok: true as const };
  }

  async function handleReportSubmit(reason: string, note: string) {
    if (!userId) {
      return { ok: false, error: "You need to be logged in to report." };
    }

    const supabase = createClient();
    const { error } = await supabase.from("reports").insert({
      item_id: item.id,
      reporter_id: userId,
      reason,
      note: note.trim() || null,
    });

    if (error) {
      // unique(item_id, reporter_id, status) — only blocks a duplicate OPEN
      // report, so this means they already have one pending on this item.
      if (error.code === "23505") {
        return { ok: false, error: "You already have an open report on this item." };
      }
      return { ok: false, error: error.message };
    }

    return { ok: true as const };
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/browse"
          className="text-sm font-semibold text-muted hover:text-ink"
        >
          ← Back to browse
        </Link>

        <div className="mt-4 grid gap-8 sm:grid-cols-2">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-gray-bg">
            {item.photoUrl ? (
              <Image
                src={item.photoUrl}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(min-width: 640px) 50vw, 100vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                No photo
              </div>
            )}
            <div className="absolute left-3 top-3">
              <StatusTag status={item.status} />
            </div>
          </div>

          <div className="flex flex-col">
            <h1 className="text-3xl font-extrabold leading-tight text-ink">
              {item.title}
            </h1>
            <p className="mt-1 text-sm font-medium text-muted">
              Posted by {item.donatorName} · {item.postedAt}
            </p>

            <p className="mt-4 text-sm leading-relaxed text-ink">
              {item.description}
            </p>

            <p className="mt-4 text-sm font-medium text-muted">
              {item.inquiryCount === 0
                ? "No inquiries yet"
                : `${item.inquiryCount} ${item.inquiryCount === 1 ? "inquiry" : "inquiries"} so far`}
            </p>

            {!isAdmin && (
              <button
                onClick={() => setReportModalOpen(true)}
                className="mt-2 self-start text-xs font-semibold text-muted underline-offset-2 hover:text-ink hover:underline"
              >
                Report this item
              </button>
            )}

            <div className="mt-auto pt-6">
              {isAdmin ? (
                <p className="rounded-lg border border-border bg-gray-bg px-4 py-3 text-center text-sm font-medium text-muted">
                  Viewing as admin — use a regular account to send inquiries.
                </p>
              ) : canInquire ? (
                <button
                  onClick={() => setModalOpen(true)}
                  className="w-full rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink/90 sm:w-auto"
                >
                  Send inquiry
                </button>
              ) : (
                <p className="rounded-lg border border-border bg-gray-bg px-4 py-3 text-center text-sm font-medium text-muted">
                  {item.status === "reserved"
                    ? "Already reserved"
                    : "Already given away"}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <InquiryModal
        itemTitle={item.title}
        isOpen={modalOpen}
        isLoggedIn={isLoggedIn}
        onClose={() => setModalOpen(false)}
        onSubmit={handleInquirySubmit}
      />

      <ReportItemModal
        itemTitle={item.title}
        isOpen={reportModalOpen}
        isLoggedIn={isLoggedIn}
        onClose={() => setReportModalOpen(false)}
        onSubmit={handleReportSubmit}
      />
    </div>
  );
}
