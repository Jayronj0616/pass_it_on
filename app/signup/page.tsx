"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type NameCheckStatus = "idle" | "checking" | "available" | "taken";

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameCheckStatus, setNameCheckStatus] = useState<NameCheckStatus>("idle");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace("/");
      }
    });
  }, [router]);

  useEffect(() => {
    const trimmed = displayName.trim();
    if (trimmed.length === 0) {
      setNameCheckStatus("idle");
      return;
    }

    setNameCheckStatus("checking");
    const timeout = setTimeout(async () => {
      const supabase = createClient();
      const { data, error: checkError } = await supabase
        .from("public_profiles")
        .select("id")
        .ilike("display_name", trimmed)
        .limit(1);

      if (checkError) {
        // Fail open — don't block typing on a check failure, submit will
        // still catch a real collision via the DB unique index.
        setNameCheckStatus("idle");
        return;
      }

      setNameCheckStatus(data && data.length > 0 ? "taken" : "available");
    }, 500);

    return () => clearTimeout(timeout);
  }, [displayName]);

  const canSubmit =
    displayName.trim().length > 0 &&
    nameCheckStatus === "available" &&
    email.trim().length > 0 &&
    password.length >= 6;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName.trim() } },
    });

    if (signUpError) {
      // Backstop for the race condition where two people grab the same name
      // between the live check and this submit — the DB unique index
      // (0010_display_name_unique.sql) is the actual source of truth.
      const message = /duplicate key|profiles_display_name_lower_idx/i.test(
        signUpError.message
      )
        ? "That username was just taken — please choose another."
        : signUpError.message;
      setError(message);
      setSubmitting(false);
      return;
    }

    // profiles row is created server-side by the on_auth_user_created
    // trigger — nothing to insert here.

    if (!data.session) {
      // Email confirmation is enabled — no session yet, user needs to
      // verify via the OTP code before they can do anything requiring auth.
      router.push(`/verify?email=${encodeURIComponent(email)}`);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="text-xl font-extrabold tracking-tight text-ink">
        PassItOn
      </Link>

      <div className="card-shadow mt-8 w-full max-w-sm rounded-2xl border border-border bg-surface p-6">
        <h1 className="text-lg font-bold text-ink">Create an account</h1>
        <p className="mt-1 text-sm text-muted">
          Join to post items or send inquiries on things you need.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-5">
          <label
            htmlFor="signup-name"
            className="block text-sm font-semibold text-ink"
          >
            Display name
          </label>
          <input
            id="signup-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Jayron"
            className="mt-1.5 w-full rounded-lg border border-border bg-page p-3 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
          />
          {nameCheckStatus === "checking" && (
            <p className="mt-1 text-xs text-muted">Checking availability...</p>
          )}
          {nameCheckStatus === "available" && (
            <p className="mt-1 text-xs text-green-text">Available</p>
          )}
          {nameCheckStatus === "taken" && (
            <p className="mt-1 text-xs text-red-700">Already taken</p>
          )}
          {nameCheckStatus === "idle" && (
            <p className="mt-1 text-xs text-muted">
              Shown to other users — not your real name if you&apos;d rather not.
            </p>
          )}

          <label
            htmlFor="signup-email"
            className="mt-4 block text-sm font-semibold text-ink"
          >
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1.5 w-full rounded-lg border border-border bg-page p-3 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
          />

          <label
            htmlFor="signup-password"
            className="mt-4 block text-sm font-semibold text-ink"
          >
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="mt-1.5 w-full rounded-lg border border-border bg-page p-3 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
          />

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="mt-5 w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-ink hover:underline">
            Log in
          </Link>
        </p>
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
