"use client";

import { useState } from "react";

type SubmitResult = { ok: true } | { ok: false; error: string };

const REASONS = [
  "Misleading photo or description",
  "Prohibited or unsafe item",
  "Spam or duplicate listing",
  "Other",
];

type ReportItemModalProps = {
  itemTitle: string;
  isOpen: boolean;
  isLoggedIn: boolean;
  onClose: () => void;
  onSubmit: (reason: string, note: string) => Promise<SubmitResult>;
};

export function ReportItemModal({
  itemTitle,
  isOpen,
  isLoggedIn,
  onClose,
  onSubmit,
}: ReportItemModalProps) {
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await onSubmit(reason, note);

    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  function handleClose() {
    setSubmitted(false);
    setReason(REASONS[0]);
    setNote("");
    setError(null);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
    >
      <div
        className="card-shadow w-full max-w-md rounded-2xl border border-border bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {!isLoggedIn ? (
          <div>
            <h2 className="text-lg font-bold text-ink">Log in to report</h2>
            <p className="mt-2 text-sm text-muted">
              You&apos;ll need an account to report &ldquo;{itemTitle}&rdquo;.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-gray-bg hover:text-ink"
              >
                Cancel
              </button>
              <a
                href="/login"
                className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
              >
                Log in
              </a>
            </div>
          </div>
        ) : submitted ? (
          <div>
            <h2 className="text-lg font-bold text-ink">Report sent</h2>
            <p className="mt-2 text-sm text-muted">
              Thanks — an admin will review &ldquo;{itemTitle}&rdquo;. This
              doesn&apos;t remove the listing on its own.
            </p>
            <div className="mt-5 flex justify-end">
              <button
                onClick={handleClose}
                className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="text-lg font-bold text-ink">
              Report &ldquo;{itemTitle}&rdquo;
            </h2>
            <p className="mt-1 text-sm text-muted">
              Flags this for admin review. It won&apos;t remove the listing
              automatically.
            </p>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <label
              htmlFor="report-reason"
              className="mt-4 block text-sm font-semibold text-ink"
            >
              Reason
            </label>
            <select
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-page p-3 text-sm text-ink focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <label
              htmlFor="report-note"
              className="mt-4 block text-sm font-semibold text-ink"
            >
              Additional details (optional)
            </label>
            <textarea
              id="report-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Anything that helps an admin review this."
              className="mt-1.5 w-full rounded-lg border border-border bg-page p-3 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-gray-bg hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90 disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Submit report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
