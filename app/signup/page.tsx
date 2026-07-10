"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    displayName.trim().length > 0 &&
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
      options: { data: { display_name: displayName } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setSubmitting(false);
      return;
    }

    // profiles row is created server-side by the on_auth_user_created
    // trigger — nothing to insert here.

    if (!data.session) {
      // Email confirmation is enabled — no session yet, user needs to
      // confirm via email before they can log in.
      setError("Check your email to confirm your account before logging in.");
      setSubmitting(false);
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
          <p className="mt-1 text-xs text-muted">
            Shown to other users — not your real name if you&apos;d rather not.
          </p>

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
    </div>
  );
}
