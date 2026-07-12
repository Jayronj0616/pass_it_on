"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const RESEND_COOLDOWN_SECONDS = 30;

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const canSubmit = email.length > 0 && code.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    setResendMessage(null);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "signup",
    });

    if (verifyError) {
      const message = /expired/i.test(verifyError.message)
        ? "That code has expired — request a new one below."
        : /invalid|token/i.test(verifyError.message)
        ? "That code isn't right — check it and try again."
        : verifyError.message;
      setError(message);
      setSubmitting(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleResend() {
    if (cooldown > 0 || !email) return;
    setResending(true);
    setError(null);
    setResendMessage(null);

    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (resendError) {
      setError(resendError.message);
      setResending(false);
      return;
    }

    setResendMessage("A new code is on its way — check your email.");
    setCooldown(RESEND_COOLDOWN_SECONDS);
    setResending(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="text-xl font-extrabold tracking-tight text-ink">
        PassItOn
      </Link>

      <div className="card-shadow mt-8 w-full max-w-sm rounded-2xl border border-border bg-surface p-6">
        <h1 className="text-lg font-bold text-ink">Verify your email</h1>
        <p className="mt-1 text-sm text-muted">
          {email
            ? <>Enter the code sent to <span className="font-semibold text-ink">{email}</span>.</>
            : "Enter the code sent to your email."}
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {resendMessage && !error && (
          <p className="mt-4 rounded-lg bg-green-bg p-3 text-sm text-green-text">
            {resendMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-5">
          <label htmlFor="verify-code" className="block text-sm font-semibold text-ink">
            Verification code
          </label>
          <input
            id="verify-code"
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
            className="mt-1.5 w-full rounded-lg border border-border bg-page p-3 text-center text-lg tracking-[0.3em] text-ink placeholder:text-muted placeholder:tracking-normal focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
          />
          <p className="mt-1 text-xs text-muted">
            Codes expire after 15 minutes — request a new one if yours ran out.
          </p>

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="mt-5 w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Verifying..." : "Verify"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldown > 0 || !email}
          className="mt-3 w-full text-center text-sm font-semibold text-ink hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
        >
          {cooldown > 0
            ? `Resend code (${cooldown}s)`
            : resending
            ? "Sending..."
            : "Resend code"}
        </button>
      </div>

      <Link
        href="/browse"
        className="mt-6 text-sm font-medium text-muted hover:text-ink"
      >
        Browse without an account
      </Link>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyForm />
    </Suspense>
  );
}
