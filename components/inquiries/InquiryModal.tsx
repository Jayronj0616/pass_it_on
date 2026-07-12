"use client";

import { useState } from "react";

type SubmitResult = { ok: true } | { ok: false; error: string };

type InquiryModalProps = {
  itemTitle: string;
  isOpen: boolean;
  isLoggedIn: boolean;
  isEmailVerified: boolean;
  verifyHref: string;
  onClose: () => void;
  onSubmit: (message: string) => Promise<SubmitResult>;
};

export function InquiryModal({
  itemTitle,
  isOpen,
  isLoggedIn,
  isEmailVerified,
  verifyHref,
  onClose,
  onSubmit,
}: InquiryModalProps) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await onSubmit(message);

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
    setMessage("");
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
          <LoggedOutState itemTitle={itemTitle} onClose={handleClose} />
        ) : !isEmailVerified ? (
          <UnverifiedState
            itemTitle={itemTitle}
            verifyHref={verifyHref}
            onClose={handleClose}
          />
        ) : submitted ? (
          <SubmittedState itemTitle={itemTitle} onClose={handleClose} />
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="text-lg font-bold text-ink">
              Inquire about &ldquo;{itemTitle}&rdquo;
            </h2>
            <p className="mt-1 text-sm text-muted">
              Tell the donator why you&apos;d like this. They&apos;ll review
              inquiries and choose who to give it to.
            </p>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <label
              htmlFor="inquiry-message"
              className="mt-4 block text-sm font-semibold text-ink"
            >
              Message (optional)
            </label>
            <textarea
              id="inquiry-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="e.g. I could really use this for my new apartment, I can pick up anytime this week."
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
                {submitting ? "Sending…" : "Send inquiry"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function LoggedOutState({
  itemTitle,
  onClose,
}: {
  itemTitle: string;
  onClose: () => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold text-ink">Log in to inquire</h2>
      <p className="mt-2 text-sm text-muted">
        You&apos;ll need an account to send an inquiry for &ldquo;{itemTitle}
        &rdquo;. It&apos;s how the donator knows who to contact if they choose
        you.
      </p>
      <div className="mt-5 flex justify-end gap-3">
        <button
          onClick={onClose}
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
  );
}

function UnverifiedState({
  itemTitle,
  verifyHref,
  onClose,
}: {
  itemTitle: string;
  verifyHref: string;
  onClose: () => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold text-ink">Verify your email to inquire</h2>
      <p className="mt-2 text-sm text-muted">
        You&apos;ll need to verify your email before sending an inquiry for
        &ldquo;{itemTitle}&rdquo;.
      </p>
      <div className="mt-5 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-lg px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-gray-bg hover:text-ink"
        >
          Cancel
        </button>
        <a
          href={verifyHref}
          className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
        >
          Verify email
        </a>
      </div>
    </div>
  );
}

function SubmittedState({
  itemTitle,
  onClose,
}: {
  itemTitle: string;
  onClose: () => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold text-ink">Inquiry sent</h2>
      <p className="mt-2 text-sm text-muted">
        The donator will review inquiries for &ldquo;{itemTitle}&rdquo; and
        reach out if they choose you. You can check the status anytime from
        your inquiries.
      </p>
      <div className="mt-5 flex justify-end">
        <button
          onClick={onClose}
          className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
        >
          Done
        </button>
      </div>
    </div>
  );
}
