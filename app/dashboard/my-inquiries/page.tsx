import Link from "next/link";
import {
  MyInquiryCard,
  type MyInquiryData,
} from "@/components/dashboard/MyInquiryCard";

// Placeholder data — replace with a Supabase query once the DB is wired up.
// select inquiries.*, items.title, items.photo_url, items.status as item_status
// from inquiries join items on items.id = inquiries.item_id
// where inquiries.receiver_id = auth.uid()
// Contact fields below only get populated for real once /api/inquiries/[id]/contact
// confirms status = approved and caller = receiver_id — never a direct profiles read.
const MOCK_INQUIRIES: MyInquiryData[] = [
  {
    id: "i1",
    itemId: "1",
    itemTitle: "Oak bookshelf, 5 shelves",
    itemPhotoUrl: null,
    itemStatus: "available",
    status: "pending",
    sentAt: "2 hours ago",
  },
  {
    id: "i2",
    itemId: "2",
    itemTitle: "Box of kids' picture books",
    itemPhotoUrl: null,
    itemStatus: "reserved",
    status: "approved",
    sentAt: "3 days ago",
    contact: {
      email: "mira.tan@gmail.com",
      phone: "0917 234 5678",
    },
  },
  {
    id: "i3",
    itemId: "3",
    itemTitle: "Standing desk frame",
    itemPhotoUrl: null,
    itemStatus: "completed",
    status: "closed",
    sentAt: "2 weeks ago",
  },
  {
    id: "i4",
    itemId: "4",
    itemTitle: "Ceramic plant pots (set of 3)",
    itemPhotoUrl: null,
    itemStatus: "available",
    status: "rejected",
    sentAt: "1 week ago",
  },
];

export default function MyInquiriesPage() {
  const inquiries = MOCK_INQUIRIES;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="text-xl font-extrabold tracking-tight text-ink"
          >
            PassItOn
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/my-items" className="text-sm font-semibold text-muted hover:text-ink">
              My items
            </Link>
            <Link href="/profile" className="text-sm font-semibold text-muted hover:text-ink">
              Profile
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-extrabold text-ink">Your inquiries</h1>
        <p className="mt-1 text-sm text-muted">
          Track what you&apos;ve asked for and see contact info once a
          donator approves you.
        </p>

        {inquiries.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {inquiries.map((inquiry) => (
              <MyInquiryCard key={inquiry.id} inquiry={inquiry} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card-shadow mt-6 flex flex-col items-center justify-center rounded-2xl border border-border bg-surface py-24 text-center">
      <p className="text-xl font-bold text-ink">No inquiries yet</p>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Browse items and send an inquiry when you find something you need.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
      >
        Browse items
      </Link>
    </div>
  );
}
