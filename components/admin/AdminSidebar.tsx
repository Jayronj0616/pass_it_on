"use client";

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

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-ink">
      <div className="px-5 py-6">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-white">
          PassItOn
        </Link>
        <p className="mt-0.5 text-xs font-semibold text-white/50">Admin</p>
      </div>

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
  );
}
