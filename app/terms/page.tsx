import Link from "next/link";

export const metadata = {
  title: "Terms of Service — PassItOn",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-ink">
          PassItOn
        </Link>

        <h1 className="mt-8 text-2xl font-extrabold tracking-tight text-ink">
          Terms of Service
        </h1>
        <p className="mt-1 text-xs text-muted">Last updated September 2026.</p>

        <div className="mt-6 space-y-6 text-sm leading-relaxed text-ink">
          <section>
            <h2 className="text-base font-bold text-ink">What PassItOn is</h2>
            <p className="mt-2 text-muted">
              PassItOn is a free platform for giving away items you no longer
              need. Donators post items; receivers browse and send inquiries.
              No money changes hands on the platform — items are given away
              for free, and any exchange happens directly between the two
              parties, outside the app.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink">Your responsibilities</h2>
            <p className="mt-2 text-muted">
              You&apos;re responsible for the accuracy of what you post and
              what you say in messages. Don&apos;t post items you don&apos;t
              actually own or intend to give away, and don&apos;t use the
              platform to harass, scam, or mislead other users. Meeting up to
              hand off an item is between you and the other person — use your
              own judgment about where and how to meet, and PassItOn isn&apos;t
              responsible for what happens during that exchange.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink">Items &amp; condition</h2>
            <p className="mt-2 text-muted">
              Items are given away as-is. Donators should describe an
              item&apos;s condition honestly; receivers accept items knowing
              they aren&apos;t new or guaranteed. PassItOn doesn&apos;t inspect,
              certify, or take responsibility for the condition or safety of
              any item posted.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink">Moderation</h2>
            <p className="mt-2 text-muted">
              We can remove listings, close inquiries, or suspend accounts
              that violate these terms or are reported as abusive, fraudulent,
              or unsafe. We try to act on reports promptly but don&apos;t
              guarantee a specific response time.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink">Changes</h2>
            <p className="mt-2 text-muted">
              We may update these terms as the platform evolves. Continued use
              of PassItOn after a change means you accept the updated terms.
            </p>
          </section>
        </div>

        <Link
          href="/"
          className="mt-8 inline-block text-sm font-medium text-muted hover:text-ink"
        >
          ← Back home
        </Link>
      </div>
    </div>
  );
}
