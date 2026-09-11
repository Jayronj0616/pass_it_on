import Link from "next/link";

// Shared footer for every page that has the shared header (landing, the
// (app) group, and the auth pages) — mirrors the header's visual weight
// instead of leaving pages to end abruptly after their content.
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="text-lg font-extrabold tracking-tight text-ink">
            PassItOn
          </p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
            Don&apos;t throw it away. Pass it on. A donation marketplace
            where the giver decides who gets it.
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Navigation
          </p>
          <nav className="mt-4 flex flex-col gap-2.5">
            <Link href="/" className="text-sm text-muted hover:text-ink">
              Home
            </Link>
            <Link href="/browse" className="text-sm text-muted hover:text-ink">
              Browse
            </Link>
            <Link href="/items/new" className="text-sm text-muted hover:text-ink">
              Post an item
            </Link>
          </nav>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Account
          </p>
          <nav className="mt-4 flex flex-col gap-2.5">
            <Link href="/login" className="text-sm text-muted hover:text-ink">
              Log in
            </Link>
            <Link href="/signup" className="text-sm text-muted hover:text-ink">
              Sign up
            </Link>
            <Link
              href="/dashboard/my-items"
              className="text-sm text-muted hover:text-ink"
            >
              My items
            </Link>
            <Link
              href="/messages"
              className="text-sm text-muted hover:text-ink"
            >
              Messages
            </Link>
          </nav>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Legal
          </p>
          <nav className="mt-4 flex flex-col gap-2.5">
            <Link href="/privacy" className="text-sm text-muted hover:text-ink">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-muted hover:text-ink">
              Terms of Service
            </Link>
          </nav>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-5 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} PassItOn. All rights reserved.
          </p>
          <p className="text-xs text-muted">
            Made for people who&apos;d rather give it away than throw it
            away.
          </p>
        </div>
      </div>
    </footer>
  );
}
