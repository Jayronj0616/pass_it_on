import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — PassItOn",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-ink">
          PassItOn
        </Link>

        <h1 className="mt-8 text-2xl font-extrabold tracking-tight text-ink">
          Privacy Policy
        </h1>
        <p className="mt-1 text-xs text-muted">Last updated September 2026.</p>

        <div className="mt-6 space-y-6 text-sm leading-relaxed text-ink">
          <section>
            <h2 className="text-base font-bold text-ink">What we collect</h2>
            <p className="mt-2 text-muted">
              When you create an account, we collect your display name, email
              address, and, if you choose to add one, a phone number. When you
              post an item, we store its title, description, and photo. When
              you send an inquiry or message another user, we store that
              content so both sides of the conversation can see it.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink">How it&apos;s used</h2>
            <p className="mt-2 text-muted">
              Your display name and item listings are shown publicly so other
              users can browse and decide whether to inquire. Your email (and
              phone, if you&apos;ve opted to share it) is only revealed to a
              receiver after you approve their inquiry on one of your items —
              never before, and never to anyone else. Messages sent through
              the app are only visible to the donator and receiver on that
              specific inquiry.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink">Who we share it with</h2>
            <p className="mt-2 text-muted">
              We don&apos;t sell or share your data with advertisers or other
              third parties. Data is stored with Supabase, our database and
              file-storage provider, which processes it on our behalf under
              its own security practices. We don&apos;t use analytics or
              tracking scripts.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink">Your choices</h2>
            <p className="mt-2 text-muted">
              You can edit or remove your display name, phone number, and the
              share-phone setting at any time from your{" "}
              <Link href="/profile" className="font-semibold text-ink hover:underline">
                profile
              </Link>
              . Contact and pickup for donated items happen outside the app —
              we don&apos;t collect or store anything about that exchange.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-ink">Contact</h2>
            <p className="mt-2 text-muted">
              Questions about your data, or want your account and its data
              deleted? Reach out through the contact details on your account
              confirmation email, or ask an admin via the platform.
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
