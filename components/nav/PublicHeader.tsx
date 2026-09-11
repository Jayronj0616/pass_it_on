import Link from "next/link";

// Minimal header for the auth pages (login/signup) — deliberately lighter
// than the (app) group's header (no Log in/Sign up links, since the page
// itself already is that) but still a real bordered header bar instead of
// a floating logo, matching the rest of the site's chrome.
export function PublicHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/">
          <p className="text-xl font-extrabold tracking-tight text-ink">
            PassItOn
          </p>
          <p className="text-xs font-medium text-muted">
            Don&apos;t throw it away. Pass it on.
          </p>
        </Link>

        <Link
          href="/browse"
          className="text-sm font-semibold text-muted hover:text-ink"
        >
          Browse
        </Link>
      </div>
    </header>
  );
}
