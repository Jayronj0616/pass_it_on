"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    // Placeholder — replace with supabase.auth.signInWithPassword({ email, password })
    setSubmitting(true);
    console.log("login submitted:", { email, password });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="text-xl font-extrabold tracking-tight text-ink">
        PassItOn
      </Link>

      <div className="card-shadow mt-8 w-full max-w-sm rounded-2xl border border-border bg-surface p-6">
        <h1 className="text-lg font-bold text-ink">Log in</h1>
        <p className="mt-1 text-sm text-muted">
          Welcome back — good to see you giving things a second life.
        </p>

        <form onSubmit={handleSubmit} className="mt-5">
          <label htmlFor="login-email" className="block text-sm font-semibold text-ink">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1.5 w-full rounded-lg border border-border bg-page p-3 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
          />

          <label
            htmlFor="login-password"
            className="mt-4 block text-sm font-semibold text-ink"
          >
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1.5 w-full rounded-lg border border-border bg-page p-3 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
          />

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="mt-5 w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-ink hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
