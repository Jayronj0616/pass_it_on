<<<<<<< HEAD
import { createAdminClient } from "@/lib/supabase/admin";
import { AccountsPageClient } from "./AccountsPageClient";
import type { AdminAccount } from "@/components/admin/AccountsTable";

export default async function AdminAccountsPage() {
  const admin = createAdminClient();

  // items/inquiries counts per account: pulling raw donator_id/receiver_id
  // columns and counting in JS rather than a GROUP BY, since supabase-js
  // doesn't do server-side aggregation without an RPC or view. Fine at
  // current scale — revisit with a view/RPC if the accounts list grows large.
  const [{ data: profiles }, { data: items }, { data: inquiries }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, display_name, email, phone, is_admin, suspended, created_at")
        .order("created_at", { ascending: false }),
      admin.from("items").select("donator_id"),
      admin.from("inquiries").select("receiver_id"),
    ]);

  const itemCounts = new Map<string, number>();
  for (const item of items ?? []) {
    itemCounts.set(item.donator_id, (itemCounts.get(item.donator_id) ?? 0) + 1);
  }

  const inquiryCounts = new Map<string, number>();
  for (const inquiry of inquiries ?? []) {
    inquiryCounts.set(
      inquiry.receiver_id,
      (inquiryCounts.get(inquiry.receiver_id) ?? 0) + 1
    );
  }

  const accounts: AdminAccount[] = (profiles ?? []).map((p) => ({
    id: p.id,
    displayName: p.display_name,
    email: p.email,
    phone: p.phone,
    isAdmin: p.is_admin,
    suspended: p.suspended,
    createdAt: new Date(p.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    itemsPosted: itemCounts.get(p.id) ?? 0,
    inquiriesSent: inquiryCounts.get(p.id) ?? 0,
  }));

  return <AccountsPageClient initialAccounts={accounts} />;
=======
"use client";

import { useState } from "react";
import { AccountsTable, type AdminAccount } from "@/components/admin/AccountsTable";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

// Placeholder data — replace with: select *, count(items), count(inquiries) from profiles
// Admin exception to SYSTEM.md §4/§5: this query reads email/phone directly, but only
// through a server route that checks the caller's own profiles.is_admin = true first.
// Never expose this table shape to a plain client-side RLS SELECT.
const INITIAL_ACCOUNTS: AdminAccount[] = [
  {
    id: "u1",
    displayName: "Mira T.",
    email: "mira.tan@gmail.com",
    phone: "0917 234 5678",
    isAdmin: false,
    suspended: false,
    createdAt: "Jan 14, 2026",
    itemsPosted: 6,
    inquiriesSent: 2,
  },
  {
    id: "u2",
    displayName: "Jordan P.",
    email: "jordan.p@outlook.com",
    phone: null,
    isAdmin: false,
    suspended: false,
    createdAt: "Feb 2, 2026",
    itemsPosted: 1,
    inquiriesSent: 9,
  },
  {
    id: "u3",
    displayName: "Sam R.",
    email: "samr99@yahoo.com",
    phone: "0928 111 2233",
    isAdmin: false,
    suspended: true,
    createdAt: "Feb 20, 2026",
    itemsPosted: 0,
    inquiriesSent: 14,
  },
  {
    id: "u4",
    displayName: "Jayron",
    email: "jayron@passiton.app",
    phone: null,
    isAdmin: true,
    suspended: false,
    createdAt: "Jan 1, 2026",
    itemsPosted: 0,
    inquiriesSent: 0,
  },
  {
    id: "u5",
    displayName: "Casey L.",
    email: "casey.lim@gmail.com",
    phone: "0933 445 6677",
    isAdmin: false,
    suspended: false,
    createdAt: "Mar 5, 2026",
    itemsPosted: 3,
    inquiriesSent: 4,
  },
];

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<AdminAccount[]>(INITIAL_ACCOUNTS);
  const [pendingAccount, setPendingAccount] = useState<AdminAccount | null>(null);
  const [working, setWorking] = useState(false);

  function runToggleSuspend() {
    if (!pendingAccount) return;
    setWorking(true);
    // Placeholder — replace with an update to profiles.suspended via a server
    // route that also checks caller.is_admin server-side.
    setTimeout(() => {
      setAccounts((prev) =>
        prev.map((account) =>
          account.id === pendingAccount.id
            ? { ...account, suspended: !account.suspended }
            : account,
        ),
      );
      setWorking(false);
      setPendingAccount(null);
    }, 300);
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Accounts</h1>
      <p className="mt-1 text-sm text-muted">
        All registered users. Suspending an account blocks login and new
        listings — existing items stay visible unless also removed.
      </p>

      <div className="mt-6">
        <AccountsTable accounts={accounts} onToggleSuspend={(id) => {
          const account = accounts.find((a) => a.id === id);
          if (account) setPendingAccount(account);
        }} />
      </div>

      <ConfirmModal
        isOpen={pendingAccount !== null}
        pending={working}
        onCancel={() => setPendingAccount(null)}
        onConfirm={runToggleSuspend}
        title={
          pendingAccount?.suspended
            ? `Reinstate ${pendingAccount.displayName}?`
            : `Suspend ${pendingAccount?.displayName}?`
        }
        description={
          pendingAccount?.suspended
            ? "They'll regain the ability to log in, post items, and send inquiries."
            : "They won't be able to log in, post new items, or send inquiries until reinstated. Existing listings stay live."
        }
        confirmLabel={pendingAccount?.suspended ? "Reinstate" : "Suspend"}
        tone={pendingAccount?.suspended ? "default" : "danger"}
      />
    </div>
  );
>>>>>>> c98a9489027454d730cce406f24e65d63b986d31
}
