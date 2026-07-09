import { StatCard } from "@/components/admin/StatCard";

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
          sublabel="awaiting handoff"
        />
        <StatCard
          label="Inquiries"
          value={STATS.totalInquiries}
          sublabel={`${STATS.pendingInquiries} pending review`}
        />
      </div>

      <div className="card-shadow mt-8 rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-bold text-ink">Recent activity</h2>
        <div className="mt-3 flex flex-col">
          {RECENT_ACTIVITY.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between border-t border-border py-3 first:border-t-0"
            >
              <p className="text-sm text-ink">{activity.description}</p>
              <p className="shrink-0 pl-4 text-xs text-muted">{activity.timestamp}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
