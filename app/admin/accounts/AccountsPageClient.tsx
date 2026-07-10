"use client";

import { useState } from "react";
import { AccountsTable, type AdminAccount } from "@/components/admin/AccountsTable";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function AccountsPageClient({
  initialAccounts,
}: {
  initialAccounts: AdminAccount[];
}) {
  const [accounts, setAccounts] = useState<AdminAccount[]>(initialAccounts);
  const [pendingAccount, setPendingAccount] = useState<AdminAccount | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runToggleSuspend() {
    if (!pendingAccount) return;
    setWorking(true);
    setError(null);

    const res = await fetch(`/api/admin/accounts/${pendingAccount.id}/suspend`, {
      method: "POST",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Something went wrong. Try again.");
      setWorking(false);
      return;
    }

    const { suspended } = await res.json();

    setAccounts((prev) =>
      prev.map((account) =>
        account.id === pendingAccount.id ? { ...account, suspended } : account
      )
    );
    setWorking(false);
    setPendingAccount(null);
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Accounts</h1>
      <p className="mt-1 text-sm text-muted">
        All registered users. Suspending an account blocks login and new
        listings — existing items stay visible unless also removed.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6">
        <AccountsTable
          accounts={accounts}
          onToggleSuspend={(id) => {
            const account = accounts.find((a) => a.id === id);
            if (account) setPendingAccount(account);
          }}
        />
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
}
