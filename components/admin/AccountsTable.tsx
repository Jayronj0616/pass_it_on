"use client";

export type AdminAccount = {
  id: string;
  displayName: string;
  email: string;
  phone: string | null;
  isAdmin: boolean;
  suspended: boolean;
  createdAt: string;
  itemsPosted: number;
  inquiriesSent: number;
};

export function AccountsTable({
  accounts,
  onToggleSuspend,
}: {
  accounts: AdminAccount[];
  onToggleSuspend: (accountId: string) => void;
}) {
  return (
    <div className="card-shadow overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
            <th className="px-5 py-3">Name</th>
            <th className="px-5 py-3">Contact</th>
            <th className="px-5 py-3">Joined</th>
            <th className="px-5 py-3">Items</th>
            <th className="px-5 py-3">Inquiries</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id} className="border-b border-border last:border-b-0">
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-ink">{account.displayName}</p>
                  {account.isAdmin && (
                    <span className="inline-flex items-center rounded-full bg-gray-bg px-2 py-0.5 text-[11px] font-semibold text-gray-text">
                      Admin
                    </span>
                  )}
                </div>
              </td>
              <td className="px-5 py-3">
                <p className="text-ink">{account.email}</p>
                {account.phone && <p className="text-xs text-muted">{account.phone}</p>}
              </td>
              <td className="px-5 py-3 text-muted">{account.createdAt}</td>
              <td className="px-5 py-3 text-ink">{account.itemsPosted}</td>
              <td className="px-5 py-3 text-ink">{account.inquiriesSent}</td>
              <td className="px-5 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                    account.suspended
                      ? "bg-amber-bg text-amber-text"
                      : "bg-green-bg text-green-text"
                  }`}
                >
                  {account.suspended ? "Suspended" : "Active"}
                </span>
              </td>
              <td className="px-5 py-3 text-right">
                {!account.isAdmin && (
                  <button
                    onClick={() => onToggleSuspend(account.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      account.suspended
                        ? "bg-ink text-white hover:bg-ink/90"
                        : "text-muted hover:bg-gray-bg hover:text-ink"
                    }`}
                  >
                    {account.suspended ? "Reinstate" : "Suspend"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
