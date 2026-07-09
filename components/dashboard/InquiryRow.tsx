type InquiryStatus = "pending" | "approved" | "rejected" | "closed";

export type InquiryData = {
  id: string;
  receiverName: string;
  message: string;
  status: InquiryStatus;
  sentAt: string;
};

const STATUS_LABEL: Record<InquiryStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Declined",
  closed: "Closed",
};

const STATUS_STYLE: Record<InquiryStatus, string> = {
  pending: "bg-gray-bg text-gray-text",
  approved: "bg-green-bg text-green-text",
  rejected: "bg-gray-bg text-muted",
  closed: "bg-gray-bg text-muted",
};

export function InquiryRow({
  inquiry,
  itemIsReserved,
  onApprove,
  onReject,
}: {
  inquiry: InquiryData;
  itemIsReserved: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const canAct = inquiry.status === "pending" && !itemIsReserved;

  return (
    <div className="flex flex-col gap-3 border-t border-border py-4 first:border-t-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-ink">
            {inquiry.receiverName}
          </p>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[inquiry.status]}`}
          >
            {STATUS_LABEL[inquiry.status]}
          </span>
        </div>
        {inquiry.message && (
          <p className="mt-1 text-sm text-muted">{inquiry.message}</p>
        )}
        <p className="mt-1 text-xs text-muted">{inquiry.sentAt}</p>
      </div>

      {canAct && (
        <div className="flex shrink-0 gap-2">
          <button
            onClick={onReject}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-gray-bg hover:text-ink"
          >
            Decline
          </button>
          <button
            onClick={onApprove}
            className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-ink/90"
          >
            Approve
          </button>
        </div>
      )}
    </div>
  );
}
