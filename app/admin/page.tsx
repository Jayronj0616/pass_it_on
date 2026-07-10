import { StatCard } from "@/components/admin/StatCard";
<<<<<<< HEAD
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

=======

// Placeholder data — replace with aggregate Supabase queries once wired up:
// count(*) from profiles / profiles where suspended = true
// count(*) from items group by status
// count(*) from inquiries group by status
const STATS = {
  totalAccounts: 128,
  suspendedAccounts: 3,
  totalItems: 214,
  availableItems: 96,
  reservedItems: 22,
  completedItems: 96,
  totalInquiries: 341,
  pendingInquiries: 47,
};

type RecentActivity = {
  id: string;
  description: string;
  timestamp: string;
};

const RECENT_ACTIVITY: RecentActivity[] = [
  { id: "a1", description: "Jordan P. posted \"Vintage record player\"", timestamp: "12 minutes ago" },
  { id: "a2", description: "Mira T. approved an inquiry on \"Oak bookshelf, 5 shelves\"", timestamp: "1 hour ago" },
  { id: "a3", description: "Casey L. sent an inquiry on \"Standing desk frame\"", timestamp: "2 hours ago" },
  { id: "a4", description: "Sam R. marked \"Box of kids' picture books\" as given away", timestamp: "5 hours ago" },
  { id: "a5", description: "New account: Taylor B.", timestamp: "6 hours ago" },
];

export default function AdminDashboardPage() {
>>>>>>> c98a9489027454d730cce406f24e65d63b986d31
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Admin dashboard</h1>
      <p className="mt-1 text-sm text-muted">
        Overview of accounts, listings, and inquiry activity across the
        platform.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Accounts"
<<<<<<< HEAD
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
=======
          value={STATS.totalAccounts}
          sublabel={`${STATS.suspendedAccounts} suspended`}
        />
        <StatCard
          label="Items"
          value={STATS.totalItems}
          sublabel={`${STATS.availableItems} available`}
        />
        <StatCard
          label="Reserved"
          value={STATS.reservedItems}
>>>>>>> c98a9489027454d730cce406f24e65d63b986d31
          sublabel="awaiting handoff"
        />
        <StatCard
          label="Inquiries"
<<<<<<< HEAD
          value={totalInquiries ?? 0}
          sublabel={`${pendingInquiries ?? 0} pending review`}
=======
          value={STATS.totalInquiries}
          sublabel={`${STATS.pendingInquiries} pending review`}
>>>>>>> c98a9489027454d730cce406f24e65d63b986d31
        />
      </div>

      <div className="card-shadow mt-8 rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-bold text-ink">Recent activity</h2>
        <div className="mt-3 flex flex-col">
<<<<<<< HEAD
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
=======
          {RECENT_ACTIVITY.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between border-t border-border py-3 first:border-t-0"
            >
              <p className="text-sm text-ink">{activity.description}</p>
              <p className="shrink-0 pl-4 text-xs text-muted">{activity.timestamp}</p>
            </div>
          ))}
>>>>>>> c98a9489027454d730cce406f24e65d63b986d31
        </div>
      </div>
    </div>
  );
}
