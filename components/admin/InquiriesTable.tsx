"use client";

import Link from "next/link";

type InquiryStatus = "pending" | "approved" | "rejected" | "closed";

export type AdminInquiry = {
  id: string;
  itemId: string;
  itemTitle: string;
  receiverName: string;
  donatorName: string;
  status: InquiryStatus;
  sentAt: string;
};

const STATUS_STYLE: Record<InquiryStatus, string> = {
  pending: "bg-gray-bg text-gray-text",
  approved: "bg-green-bg text-green-text",
  rejected: "bg-gray-bg text-muted",
  closed: "bg-gray-bg text-muted",
};

const STATUS_LABEL: Record<InquiryStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Declined",
  closed: "Closed",
};

export function InquiriesTable({
  inquiries,
  onForceClose,
}: {
  inquiries: AdminInquiry[];
  onForceClose: (inquiryId: string) => void;
}) {
  return (
    <div className="card-shadow overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
            <th className="px-5 py-3">Item</th>
            <th className="px-5 py-3">Receiver</th>
            <th className="px-5 py-3">Donator</th>
            <th className="px-5 py-3">Sent</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {inquiries.map((inquiry) => (
            <tr key={inquiry.id} className="border-b border-border last:border-b-0">
              <td className="px-5 py-3">
                <Link
                  href={`/items/${inquiry.itemId}`}
                  className="font-semibold text-ink hover:underline"
                >
                  {inquiry.itemTitle}
                </Link>
              </td>
              <td className="px-5 py-3 text-ink">{inquiry.receiverName}</td>
              <td className="px-5 py-3 text-ink">{inquiry.donatorName}</td>
              <td className="px-5 py-3 text-muted">{inquiry.sentAt}</td>
              <td className="px-5 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[inquiry.status]}`}
                >
                  {STATUS_LABEL[inquiry.status]}
                </span>
              </td>
              <td className="px-5 py-3 text-right">
                {(inquiry.status === "pending" || inquiry.status === "approved") && (
                  <button
                    onClick={() => onForceClose(inquiry.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-gray-bg hover:text-ink"
                  >
                    Force close
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
