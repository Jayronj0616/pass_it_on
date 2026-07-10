import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ItemCard, type ItemCardData } from "@/components/items/ItemCard";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: items, error } = await supabase
    .from("items")
    .select("id, title, description, photo_url, status, inquiry_count")
    .neq("status", "completed")
    .order("created_at", { ascending: false });

  if (error) {
    // Fail loud in dev rather than silently rendering an empty grid —
    // swap for real error UI if this needs to be user-facing later.
    console.error("Failed to load items:", error.message);
  }

  const items_: ItemCardData[] = (items ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    photoUrl: item.photo_url,
    status: item.status,
    inquiryCount: item.inquiry_count,
  }));

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
        {items_.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <p className="mb-6 text-sm font-medium text-muted">
              {items_.length} {items_.length === 1 ? "item" : "items"} up for grabs
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items_.map((item) => (
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
