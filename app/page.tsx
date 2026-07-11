import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LandingSections } from "@/components/landing/LandingSections";
import { HeroCarousel } from "@/components/landing/HeroCarousel";
import { LandingFooter } from "@/components/landing/LandingFooter";

// The marketing/landing page. Shown to everyone, every time they hit /,
// logged in or not — including right after login/signup, which both
// router.push("/"). Actual browsing lives at /browse (see app/(app)/browse).
// This page intentionally does NOT use the shared (app) layout's nav —
// it has its own minimal header, since a first-time logged-out visitor
// shouldn't see "Messages / My items" links for an account they don't have.
export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-ink">
              PassItOn
            </h1>
            <p className="text-xs font-medium text-muted">
              Don&apos;t throw it away. Pass it on.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/browse"
                className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
              >
                Go to app
              </Link>
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
        </div>
      </header>

      <main className="flex flex-1 items-center px-4 py-16 sm:px-6">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left">
            <h2 className="animate-rise-in text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
              Someone needs what you&apos;re done with.
            </h2>
            <p
              className="animate-rise-in mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted sm:text-lg lg:mx-0"
              style={{ animationDelay: "100ms" }}
            >
              PassItOn is where people give away things they no longer need —
              and the giver decides who it goes to. No race to click first.
            </p>

            <div
              className="animate-rise-in mx-auto mt-10 grid w-full max-w-lg gap-4 sm:grid-cols-2 lg:mx-0"
              style={{ animationDelay: "200ms" }}
            >
              <Link
                href={user ? "/items/new" : "/signup"}
                className="card-shadow group rounded-2xl border border-border bg-surface p-6 text-left transition-shadow hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.08)]"
              >
                <p className="text-lg font-bold text-ink">Give something away</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Post it, review who wants it, pick who gets it.
                </p>
                <span className="mt-4 inline-flex items-center text-sm font-semibold text-ink">
                  Post an item
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>

              <Link
                href="/browse"
                className="card-shadow group rounded-2xl border border-border bg-surface p-6 text-left transition-shadow hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.08)]"
              >
                <p className="text-lg font-bold text-ink">
                  Find something you need
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Browse what people are giving away, and ask.
                </p>
                <span className="mt-4 inline-flex items-center text-sm font-semibold text-ink">
                  Browse items
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>

          <div
            className="animate-rise-in mx-auto w-full max-w-md lg:mx-0"
            style={{ animationDelay: "150ms" }}
          >
            <HeroCarousel />
          </div>
        </div>
      </main>

      <LandingSections signupHref={user ? "/items/new" : "/signup"} />
      <LandingFooter />
    </div>
  );
}
