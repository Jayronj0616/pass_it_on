import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center">
      <Link href="/" className="text-xl font-extrabold tracking-tight text-ink">
        PassItOn
      </Link>

      <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-ink">404</h1>
      <p className="mt-3 text-sm text-muted">
        This page doesn&apos;t exist — it may have been moved, deleted, or the
        link might be wrong.
      </p>

      <div className="mt-6 flex gap-3">
        <Link
          href="/browse"
          className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
        >
          Browse items
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-page"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
