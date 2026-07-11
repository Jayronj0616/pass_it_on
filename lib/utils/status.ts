// Shared status-machine helpers: item status transitions, inquiry status transitions
// Mirrors SYSTEM.md §2 state diagram — keep this the single source of truth so
// API routes and UI components don't duplicate the transition logic.

// items.status / inquiries.status / reports.status are `text` with a CHECK
// constraint in the migrations, not Postgres enums (see SYSTEM.md §11) — so
// the generated Database type has them as plain `string`. Components expect
// the narrow literal unions below. These guards validate at the DB→UI
// boundary and throw on anything unexpected, rather than silently coercing —
// an invalid value here means a bug (bad migration, manual DB edit), not a
// normal case to paper over.

export type ItemStatus = "available" | "reserved" | "completed";
export type InquiryStatus = "pending" | "approved" | "rejected" | "closed";
export type ReportStatus = "open" | "resolved";

const ITEM_STATUSES: readonly string[] = ["available", "reserved", "completed"];
const INQUIRY_STATUSES: readonly string[] = ["pending", "approved", "rejected", "closed"];
const REPORT_STATUSES: readonly string[] = ["open", "resolved"];

export function asItemStatus(status: string): ItemStatus {
  if (!ITEM_STATUSES.includes(status)) {
    throw new Error(`Unexpected item status from DB: "${status}"`);
  }
  return status as ItemStatus;
}

export function asInquiryStatus(status: string): InquiryStatus {
  if (!INQUIRY_STATUSES.includes(status)) {
    throw new Error(`Unexpected inquiry status from DB: "${status}"`);
  }
  return status as InquiryStatus;
}

export function asReportStatus(status: string): ReportStatus {
  if (!REPORT_STATUSES.includes(status)) {
    throw new Error(`Unexpected report status from DB: "${status}"`);
  }
  return status as ReportStatus;
}
