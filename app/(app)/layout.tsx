import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { MobileNavDrawer } from "@/components/nav/MobileNavDrawer";

// Shared nav for every consumer-facing page (/browse, /messages, /dashboard/*,
// /profile, /items/*). Admins never reach here — middleware.ts redirects
// admin accounts hitting anything outside /admin/* (except /login, /signup)
// back to /admin, same boundary that already existed before this layout.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="shrink-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">
              PassItOn
            </h1>
            <p className="text-xs font-medium text-muted">
              Don&apos;t throw it away. Pass it on.
            </p>
          </Link>

          <div className="hidden items-center gap-4 md:flex">
            <Link
              href="/browse"
              className="text-sm font-semibold text-muted hover:text-ink"
            >
              Browse
            </Link>

            {user ? (
              <>
                <Link
                  href="/messages"
                  className="text-sm font-semibold text-muted hover:text-ink"
                >
                  Messages
                </Link>
                <Link
                  href="/dashboard/my-items"
                  className="text-sm font-semibold text-muted hover:text-ink"
                >
                  My items
                </Link>
                <Link
                  href="/dashboard/my-inquiries"
                  className="text-sm font-semibold text-muted hover:text-ink"
                >
                  My inquiries
                </Link>
                <Link
                  href="/profile"
                  className="text-sm font-semibold text-muted hover:text-ink"
                >
                  Profile
                </Link>
                <Link
                  href="/items/new"
                  className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
                >
                  Post an item
                </Link>
                <SignOutButton className="text-sm font-semibold text-muted hover:text-ink" />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-muted hover:text-ink"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          <MobileNavDrawer isLoggedIn={!!user} />
        </div>
      </header>

      <div className="flex-1">{children}</div>
    </div>
  );
}
