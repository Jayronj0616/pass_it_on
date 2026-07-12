"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/accounts", label: "Accounts" },
  { href: "/admin/items", label: "Items" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/reports", label: "Reports" },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              active
                ? "bg-white/10 text-white"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar with burger — sidebar itself is hidden below md */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-ink px-4 py-3 md:hidden">
        <Link href="/" className="text-base font-extrabold tracking-tight text-white">
          PassItOn <span className="font-semibold text-white/50">Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"
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
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-64 max-w-[85vw] flex-col bg-ink shadow-xl">
            <div className="flex items-center justify-between px-5 py-6">
              <span className="text-lg font-extrabold tracking-tight text-white">
                PassItOn
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
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

            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />

            <div className="mt-auto px-3 pb-6">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-semibold text-white/50 hover:bg-white/5 hover:text-white"
              >
                ← Back to site
              </Link>
              <SignOutButton className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-white/50 hover:bg-white/5 hover:text-white" />
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar — unchanged from before, just hidden below md now */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-ink md:flex">
        <div className="px-5 py-6">
          <Link href="/" className="text-lg font-extrabold tracking-tight text-white">
            PassItOn
          </Link>
          <p className="mt-0.5 text-xs font-semibold text-white/50">Admin</p>
        </div>

        <NavLinks pathname={pathname} />

        <div className="mt-auto px-3 pb-6">
          <Link
            href="/"
            className="block rounded-lg px-3 py-2 text-sm font-semibold text-white/50 hover:bg-white/5 hover:text-white"
          >
            ← Back to site
          </Link>
          <SignOutButton className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-white/50 hover:bg-white/5 hover:text-white" />
        </div>
      </aside>
    </>
  );
}
