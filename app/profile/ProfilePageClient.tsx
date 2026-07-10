"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProfileForm, type ProfileFormValues } from "@/components/profile/ProfileForm";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { createClient } from "@/lib/supabase/client";

export function ProfilePageClient({
  userId,
  initialProfile,
}: {
  userId: string;
  initialProfile: ProfileFormValues;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileFormValues>(initialProfile);
  const [pendingValues, setPendingValues] = useState<ProfileFormValues | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Local-only flag: true right after updateUser({ email }) succeeds, so we
  // can tell the user to check their inbox. profiles.email intentionally
  // does NOT change yet — see 0005_email_confirm_sync.sql. This flag doesn't
  // persist across a reload; that's fine, it's just an acknowledgement of
  // the action just taken, not a source of truth about pending state.
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);

  function handleFormSubmit(values: ProfileFormValues) {
    setError(null);
    setPendingValues(values);
  }

  async function confirmSave() {
    if (!pendingValues) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const emailChanged = pendingValues.email.trim() !== profile.email;

    if (emailChanged) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: pendingValues.email.trim(),
      });
      if (emailError) {
        setError(emailError.message);
        setSaving(false);
        return;
      }
    }

    // Email is deliberately excluded here — it only updates via the
    // confirmation flow above + the DB trigger, never a direct write.
    // See SYSTEM.md §11 / 0005_email_confirm_sync.sql for why.
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        display_name: pendingValues.displayName,
        phone: pendingValues.phone || null,
        share_phone: pendingValues.sharePhone,
      })
      .eq("id", userId);

    if (profileError) {
      setError(profileError.message);
      setSaving(false);
      return;
    }

    setProfile({
      ...pendingValues,
      // Keep showing the OLD email in the form/state until the trigger
      // actually syncs it post-confirmation — reflects reality, not intent.
      email: profile.email,
    });
    setEmailConfirmationSent(emailChanged);
    setSaving(false);
    setPendingValues(null);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-ink">
            PassItOn
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/my-items" className="text-sm font-semibold text-muted hover:text-ink">
              My items
            </Link>
            <Link href="/dashboard/my-inquiries" className="text-sm font-semibold text-muted hover:text-ink">
              My inquiries
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-extrabold text-ink">Your profile</h1>
        <p className="mt-1 text-sm text-muted">
          This is what other users see and how they reach you once you
          approve an inquiry.
        </p>

        {emailConfirmationSent && (
          <p className="mt-4 rounded-lg bg-amber-bg p-3 text-sm text-amber-text">
            Confirmation email sent to your new address. Your email stays as{" "}
            {profile.email} until you confirm it.
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="card-shadow mt-6 rounded-2xl border border-border bg-surface p-6">
          <ProfileForm
            initialValues={profile}
            onSubmit={handleFormSubmit}
            submitting={saving}
          />
        </div>
      </main>

      <ConfirmModal
        isOpen={pendingValues !== null}
        pending={saving}
        onCancel={() => setPendingValues(null)}
        onConfirm={confirmSave}
        title="Save profile changes?"
        description={
          pendingValues && pendingValues.email.trim() !== profile.email
            ? "Your display name and contact preferences update immediately. Your email will only change once you confirm it via the link sent to your new address."
            : "Your display name and contact preferences update immediately across the app."
        }
        confirmLabel="Save changes"
      />
    </div>
  );
}
