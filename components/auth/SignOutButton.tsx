"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!signingOut) {
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(timer);
  }, [signingOut]);

  async function handleConfirmedSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={className}
      >
        Log out
      </button>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => !signingOut && setConfirming(false)}
          />
          <div className="card-shadow relative w-full max-w-sm rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-lg font-bold text-ink">Log out?</h2>
            <p className="mt-2 text-sm text-muted">
              You&apos;ll need to log back in to access your account.
            </p>
            {slow && (
              <p className="mt-3 text-xs text-muted">
                This is taking longer than expected...
              </p>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={signingOut}
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-gray-bg hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmedSignOut}
                disabled={signingOut}
                className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {signingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
