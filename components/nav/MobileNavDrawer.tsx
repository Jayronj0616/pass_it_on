"use client";

import { useState } from "react";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";

export function MobileNavDrawer({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-page"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col gap-1 bg-surface p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-extrabold tracking-tight text-ink">
                PassItOn
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-page hover:text-ink"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <Link
              href="/browse"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-ink hover:bg-page"
            >
              Browse
            </Link>

            {isLoggedIn ? (
              <>
                <Link
                  href="/messages"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-ink hover:bg-page"
                >
                  Messages
                </Link>
                <Link
                  href="/dashboard/my-items"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-ink hover:bg-page"
                >
                  My items
                </Link>
                <Link
                  href="/dashboard/my-inquiries"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-ink hover:bg-page"
                >
                  My inquiries
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-ink hover:bg-page"
                >
                  Profile
                </Link>
                <Link
                  href="/items/new"
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-lg bg-ink px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-ink/90"
                >
                  Post an item
                </Link>
                <div className="mt-2 border-t border-border pt-3">
                  <SignOutButton className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-muted hover:bg-page hover:text-ink" />
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-ink hover:bg-page"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-lg bg-ink px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-ink/90"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
