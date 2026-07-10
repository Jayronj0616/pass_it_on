"use client";

import { useState } from "react";
import { ReportsTable, type AdminReport } from "@/components/admin/ReportsTable";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function ReportsPageClient({
  initialReports,
}: {
  initialReports: AdminReport[];
}) {
  const [reports, setReports] = useState<AdminReport[]>(initialReports);
  const [pendingReport, setPendingReport] = useState<AdminReport | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runResolve() {
    if (!pendingReport) return;
    setWorking(true);
    setError(null);

    const res = await fetch(`/api/admin/reports/${pendingReport.id}/resolve`, {
      method: "POST",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Something went wrong. Try again.");
      setWorking(false);
      return;
    }

    setReports((prev) =>
      prev.map((report) =>
        report.id === pendingReport.id
          ? { ...report, status: "resolved" as const }
          : report
      )
    );
    setWorking(false);
    setPendingReport(null);
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Reports</h1>
      <p className="mt-1 text-sm text-muted">
        Items flagged by users. Resolving a report just clears it from this
        queue — to actually take an item down, remove it from the Items page.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6">
        <ReportsTable
          reports={reports}
          onResolve={(id) => {
            const report = reports.find((r) => r.id === id);
            if (report) setPendingReport(report);
          }}
        />
      </div>

      <ConfirmModal
        isOpen={pendingReport !== null}
        pending={working}
        onCancel={() => setPendingReport(null)}
        onConfirm={runResolve}
        title="Mark this report resolved?"
        description={`This clears the report on "${pendingReport?.itemTitle}" from the queue. It doesn't remove the item — do that from Items if needed.`}
        confirmLabel="Mark resolved"
      />
    </div>
  );
}
