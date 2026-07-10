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
}
