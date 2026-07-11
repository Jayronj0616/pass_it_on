import { StatCard } from "@/components/admin/StatCard";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatRelativeTime } from "@/lib/utils/format";

export default async function AdminDashboardPage() {
  const admin = createAdminClient();

  const [
    { count: totalAccounts },
    { count: suspendedAccounts },
    { count: totalItems },
    { count: availableItems },
    { count: reservedItems },
    { count: completedItems },
    { count: totalInquiries },
    { count: pendingInquiries },
    { count: openReports },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("suspended", true),
    admin.from("items").select("*", { count: "exact", head: true }),
    admin
      .from("items")
      .select("*", { count: "exact", head: true })
      .eq("status", "available"),
    admin
      .from("items")
      .select("*", { count: "exact", head: true })
      .eq("status", "reserved"),
    admin
      .from("items")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed"),
    admin.from("inquiries").select("*", { count: "exact", head: true }),
    admin
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    admin
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
  ]);

  // "Recent activity" is scoped to creation events only — the schema has
  // no timestamp for status transitions (approved_at, completed_at, etc),
  // just created_at/updated_at, so "approved an inquiry" / "marked as
  // given away" style entries from the original mock aren't derivable
  // without adding those columns. Ask before adding them if this needs
  // to show status-change events too.
  const [{ data: recentItems }, { data: recentInquiries }, { data: recentAccounts }] =
    await Promise.all([
      admin
        .from("items")
        .select("id, title, created_at, profiles(display_name)")
        .order("created_at", { ascending: false })
        .limit(5),
      admin
        .from("inquiries")
        .select("id, created_at, items(title), profiles(display_name)")
        .order("created_at", { ascending: false })
        .limit(5),
      admin
        .from("profiles")
        .select("id, display_name, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  type RawEvent = { id: string; description: string; timestamp: string };

  const events: RawEvent[] = [
    ...(recentItems ?? []).map((item) => ({
      id: `item-${item.id}`,
      description: `${item.profiles?.display_name ?? "Someone"} posted "${item.title}"`,
      timestamp: item.created_at,
    })),
    ...(recentInquiries ?? []).map((inq) => ({
      id: `inquiry-${inq.id}`,
      description: `${inq.profiles?.display_name ?? "Someone"} sent an inquiry on "${inq.items?.title ?? "an item"}"`,
      timestamp: inq.created_at,
    })),
    ...(recentAccounts ?? []).map((acc) => ({
      id: `account-${acc.id}`,
      description: `New account: ${acc.display_name}`,
      timestamp: acc.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Admin dashboard</h1>
      <p className="mt-1 text-sm text-muted">
        Overview of accounts, listings, and inquiry activity across the
        platform.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard
          label="Accounts"
          value={totalAccounts ?? 0}
          sublabel={`${suspendedAccounts ?? 0} suspended`}
        />
        <StatCard
          label="Items"
          value={totalItems ?? 0}
          sublabel={`${availableItems ?? 0} available`}
        />
        <StatCard
          label="Reserved"
          value={reservedItems ?? 0}
          sublabel="awaiting handoff"
        />
        <StatCard
          label="Inquiries"
          value={totalInquiries ?? 0}
          sublabel={`${pendingInquiries ?? 0} pending review`}
        />
        <StatCard
          label="Reports"
          value={openReports ?? 0}
          sublabel="open"
        />
      </div>

      <div className="card-shadow mt-8 rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-bold text-ink">Recent activity</h2>
        <div className="mt-3 flex flex-col">
          {events.length === 0 ? (
            <p className="py-3 text-sm text-muted">No activity yet.</p>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between border-t border-border py-3 first:border-t-0"
              >
                <p className="text-sm text-ink">{event.description}</p>
                <p className="shrink-0 pl-4 text-xs text-muted">
                  {formatRelativeTime(event.timestamp)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
