"use client";

import Link from "next/link";

type ReportStatus = "open" | "resolved";

export type AdminReport = {
  id: string;
  itemId: string;
  itemTitle: string;
  reporterName: string;
  reason: string;
  note: string | null;
  status: ReportStatus;
  reportedAt: string;
};

const STATUS_STYLE: Record<ReportStatus, string> = {
  open: "bg-amber-bg text-amber-text",
  resolved: "bg-gray-bg text-muted",
};

export function ReportsTable({
  reports,
  onResolve,
}: {
  reports: AdminReport[];
  onResolve: (reportId: string) => void;
}) {
  return (
    <div className="card-shadow overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
            <th className="px-5 py-3">Item</th>
            <th className="px-5 py-3">Reporter</th>
            <th className="px-5 py-3">Reason</th>
            <th className="px-5 py-3">Reported</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id} className="border-b border-border last:border-b-0">
              <td className="px-5 py-3">
                <Link
                  href={`/items/${report.itemId}`}
                  className="font-semibold text-ink hover:underline"
                >
                  {report.itemTitle}
                </Link>
              </td>
              <td className="px-5 py-3 text-ink">{report.reporterName}</td>
              <td className="px-5 py-3 text-ink">
                {report.reason}
                {report.note && (
                  <p className="mt-0.5 max-w-xs text-xs text-muted">{report.note}</p>
                )}
              </td>
              <td className="px-5 py-3 text-muted">{report.reportedAt}</td>
              <td className="px-5 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[report.status]}`}
                >
                  {report.status === "open" ? "Open" : "Resolved"}
                </span>
              </td>
              <td className="px-5 py-3 text-right">
                {report.status === "open" && (
                  <button
                    onClick={() => onResolve(report.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-gray-bg hover:text-ink"
                  >
                    Mark resolved
                  </button>
                )}
              </td>
            </tr>
          ))}
          {reports.length === 0 && (
            <tr>
              <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted">
                No reports yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
