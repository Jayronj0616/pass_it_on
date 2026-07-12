"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The emailed link exchanges its token for a session automatically via
    // the Supabase client's onAuthStateChange handling of the URL — just
    // confirm a session actually landed before letting the form submit,
    // so a stale/invalid link fails clearly instead of silently.
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setReady(true);
      } else {
        setError("This reset link is invalid or has expired — request a new one.");
      }
    });
  }, []);

  useEffect(() => {
    if (!submitting) {
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(timer);
  }, [submitting]);

  const canSubmit = password.length >= 6 && password === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="text-xl font-extrabold tracking-tight text-ink">
        PassItOn
      </Link>

      <div className="card-shadow mt-8 w-full max-w-sm rounded-2xl border border-border bg-surface p-6">
        <h1 className="text-lg font-bold text-ink">Set a new password</h1>
        <p className="mt-1 text-sm text-muted">
          Choose a new password for your account.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {ready && (
          <form onSubmit={handleSubmit} className="mt-5">
            <label htmlFor="reset-password" className="block text-sm font-semibold text-ink">
              New password
            </label>
            <input
              id="reset-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-lg border border-border bg-page p-3 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />

            <label
              htmlFor="reset-confirm-password"
              className="mt-4 block text-sm font-semibold text-ink"
            >
              Confirm new password
            </label>
            <input
              id="reset-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-lg border border-border bg-page p-3 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <p className="mt-1 text-xs text-red-700">Passwords don&apos;t match</p>
            )}

            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="mt-5 w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Updating..." : "Update password"}
            </button>
            {slow && (
              <p className="mt-2 text-center text-xs text-muted">
                This is taking longer than expected...
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
