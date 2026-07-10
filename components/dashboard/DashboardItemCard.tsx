"use client";

import { useState } from "react";
import Image from "next/image";
import { StatusTag } from "@/components/items/StatusTag";
import { InquiryRow, type InquiryData } from "./InquiryRow";

export type DashboardItem = {
  id: string;
  title: string;
  photoUrl: string | null;
  status: "available" | "reserved" | "completed";
  inquiries: InquiryData[];
};

export function DashboardItemCard({
  item,
  onApproveInquiry,
  onRejectInquiry,
  onMarkComplete,
}: {
  item: DashboardItem;
  onApproveInquiry: (inquiryId: string) => void;
  onRejectInquiry: (inquiryId: string) => void;
  onMarkComplete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const pendingCount = item.inquiries.filter(
    (i) => i.status === "pending",
  ).length;

  return (
    <div className="card-shadow rounded-2xl border border-border bg-surface">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-4 p-4 text-left"
      >
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-bg">
          {item.photoUrl ? (
            <Image
              src={item.photoUrl}
              alt={item.title}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">
              No photo
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-ink">{item.title}</p>
            <StatusTag status={item.status} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {item.inquiries.length === 0
              ? "No inquiries yet"
              : `${item.inquiries.length} ${item.inquiries.length === 1 ? "inquiry" : "inquiries"}`}
            {pendingCount > 0 && ` · ${pendingCount} pending`}
          </p>
        </div>

        <svg
          className={`h-5 w-5 shrink-0 text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4">
          {item.inquiries.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              No one has inquired about this yet.
            </p>
          ) : (
            item.inquiries.map((inquiry) => (
              <InquiryRow
                key={inquiry.id}
                inquiry={inquiry}
                itemIsReserved={item.status === "reserved"}
                onApprove={() => onApproveInquiry(inquiry.id)}
                onReject={() => onRejectInquiry(inquiry.id)}
              />
            ))
          )}

          {item.status === "reserved" && (
            <div className="mt-2 border-t border-border pt-4">
              <button
                onClick={onMarkComplete}
                className="rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-ink/90"
              >
                Mark as given away
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
