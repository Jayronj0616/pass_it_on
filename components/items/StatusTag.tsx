type Status = "available" | "reserved" | "completed";

const STATUS_LABEL: Record<Status, string> = {
  available: "Available",
  reserved: "Reserved",
  completed: "Given away",
};

const STATUS_STYLE: Record<Status, string> = {
  available: "bg-green-bg text-green-text border-green-border",
  reserved: "bg-amber-bg text-amber-text border-amber-border",
  completed: "bg-gray-bg text-gray-text border-border",
};

export function StatusTag({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
