import Link from "next/link";
import { ItemCard, type ItemCardData } from "@/components/items/ItemCard";

// Placeholder data — replace with a Supabase query once the DB is wired up.
// select id, title, description, photo_url, status, inquiry_count from items
// where status != 'completed' order by created_at desc
const MOCK_ITEMS: ItemCardData[] = [
  {
    id: "1",
    title: "Oak bookshelf, 5 shelves",
    description:
      "Solid oak, a little scuffed on one side but sturdy. Moving out, needs to go this week.",
    photoUrl: null,
    status: "available",
    inquiryCount: 3,
  },
  {
    id: "2",
    title: "Box of kids' picture books",
    description:
      "About 20 books, ages 3-7. Some water damage on a couple covers, pages all fine.",
    photoUrl: null,
    status: "reserved",
    inquiryCount: 5,
  },
  {
    id: "3",
    title: "Standing desk frame",
    description:
      "Motor works, no tabletop included. You'd need to attach your own surface.",
    photoUrl: null,
    status: "available",
    inquiryCount: 0,
  },
];

export default function HomePage() {
  const items = MOCK_ITEMS;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">
              PassItOn
            </h1>
            <p className="text-xs font-medium text-muted">
              Don&apos;t throw it away. Pass it on.
            </p>
          </div>
          <Link
            href="/items/new"
            className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
          >
            Post an item
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <p className="mb-6 text-sm font-medium text-muted">
              {items.length} {items.length === 1 ? "item" : "items"} up for grabs
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card-shadow flex flex-col items-center justify-center rounded-2xl border border-border bg-surface py-24 text-center">
      <p className="text-xl font-bold text-ink">Nothing here yet</p>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Be the first — got something collecting dust? Someone out there needs
        exactly that.
      </p>
      <Link
        href="/items/new"
        className="mt-6 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
      >
        Post an item
      </Link>
    </div>
  );
}
