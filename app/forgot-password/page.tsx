"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!submitting) {
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(timer);
  }, [submitting]);

  const canSubmit = email.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/reset-password` },
    );

    // Deliberately not distinguishing "email not found" from success —
    // avoids confirming which emails are registered. Supabase returns an
    // error here for malformed input/rate limits, not for unknown emails.
    if (resetError) {
      setError(resetError.message);
      setSubmitting(false);
      return;
    }

    setSent(true);
    setSubmitting(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="text-xl font-extrabold tracking-tight text-ink">
        PassItOn
      </Link>

      <div className="card-shadow mt-8 w-full max-w-sm rounded-2xl border border-border bg-surface p-6">
        <h1 className="text-lg font-bold text-ink">Reset your password</h1>
        <p className="mt-1 text-sm text-muted">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        {sent ? (
          <p className="mt-4 rounded-lg bg-green-bg p-3 text-sm text-green-text">
            If an account exists for that email, a reset link is on its way.
          </p>
        ) : (
          <>
            {error && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-5">
              <label htmlFor="forgot-email" className="block text-sm font-semibold text-ink">
                Email
              </label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-lg border border-border bg-page p-3 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />

              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="mt-5 w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Sending..." : "Send reset link"}
              </button>
              {slow && (
                <p className="mt-2 text-center text-xs text-muted">
                  This is taking longer than expected...
                </p>
              )}
            </form>
          </>
        )}

        <p className="mt-5 text-center text-sm text-muted">
          <Link href="/login" className="font-semibold text-ink hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
