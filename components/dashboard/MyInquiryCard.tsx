import Image from "next/image";
import Link from "next/link";
import { StatusTag } from "@/components/items/StatusTag";

type InquiryStatus = "pending" | "approved" | "rejected" | "closed";

export type MyInquiryData = {
  id: string;
  itemId: string;
  itemTitle: string;
  itemPhotoUrl: string | null;
  itemStatus: "available" | "reserved" | "completed";
  status: InquiryStatus;
  sentAt: string;
  // Present only when status === "approved" — mirrors what the real
  // /api/inquiries/[id]/contact route would return post-approval.
  contact?: {
    email: string;
    phone: string | null;
  };
};

const STATUS_LABEL: Record<InquiryStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Declined",
  closed: "Closed — item went to someone else",
};

const STATUS_STYLE: Record<InquiryStatus, string> = {
  pending: "bg-gray-bg text-gray-text",
  approved: "bg-green-bg text-green-text",
  rejected: "bg-gray-bg text-muted",
  closed: "bg-gray-bg text-muted",
};

export function MyInquiryCard({ inquiry }: { inquiry: MyInquiryData }) {
  return (
    <div className="card-shadow rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-4">
        <Link
          href={`/items/${inquiry.itemId}`}
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-bg"
        >
          {inquiry.itemPhotoUrl ? (
            <Image
              src={inquiry.itemPhotoUrl}
              alt={inquiry.itemTitle}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">
              No photo
            </div>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/items/${inquiry.itemId}`}
              className="font-bold text-ink hover:underline"
            >
              {inquiry.itemTitle}
            </Link>
            <StatusTag status={inquiry.itemStatus} />
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[inquiry.status]}`}
            >
              {STATUS_LABEL[inquiry.status]}
            </span>
            <span className="text-xs text-muted">{inquiry.sentAt}</span>
          </div>
        </div>
      </div>

      {inquiry.status === "approved" && inquiry.contact && (
        <div className="mt-4 rounded-lg border border-green-border bg-green-bg px-4 py-3">
          <p className="text-xs font-semibold text-green-text">
            You&apos;re approved — reach out to arrange pickup
          </p>
          <p className="mt-1.5 text-sm font-medium text-ink">
            {inquiry.contact.email}
          </p>
          {inquiry.contact.phone && (
            <p className="text-sm font-medium text-ink">
              {inquiry.contact.phone}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
