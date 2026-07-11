import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center sm:flex-row sm:justify-between sm:text-left sm:px-6">
        <div>
          <p className="text-sm font-extrabold tracking-tight text-ink">
            PassItOn
          </p>
          <p className="mt-0.5 text-xs text-muted">
            Don&apos;t throw it away. Pass it on.
          </p>
        </div>

        <nav className="flex items-center gap-5">
          <Link href="/browse" className="text-sm font-medium text-muted hover:text-ink">
            Browse
          </Link>
          <Link href="/login" className="text-sm font-medium text-muted hover:text-ink">
            Log in
          </Link>
          <Link href="/signup" className="text-sm font-medium text-muted hover:text-ink">
            Sign up
          </Link>
        </nav>

        <p className="text-xs text-muted">
          &copy; {new Date().getFullYear()} PassItOn
        </p>
      </div>
    </footer>
  );
}
