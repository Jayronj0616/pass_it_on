"use client";

import { useState } from "react";
import Link from "next/link";
import { ProfileForm, type ProfileFormValues } from "@/components/profile/ProfileForm";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

// Placeholder — replace with a Supabase query once the DB is wired up:
// select display_name, email, phone, share_phone from profiles where id = auth.uid()
const MOCK_PROFILE: ProfileFormValues = {
  displayName: "Jayron",
  email: "jayron@passiton.app",
  phone: "0917 234 5678",
  sharePhone: false,
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileFormValues>(MOCK_PROFILE);
  const [pendingValues, setPendingValues] = useState<ProfileFormValues | null>(null);
  const [saving, setSaving] = useState(false);

  function handleFormSubmit(values: ProfileFormValues) {
    setPendingValues(values);
  }

  function confirmSave() {
    if (!pendingValues) return;
    // Placeholder — replace with:
    // update profiles set display_name = ..., phone = ..., share_phone = ... where id = auth.uid()
    // Email changes need supabase.auth.updateUser({ email }) + re-verification —
    // don't just write it straight into `profiles.email` when this goes real.
    setSaving(true);
    console.log("profile submitted:", pendingValues);
    setTimeout(() => {
      setProfile(pendingValues);
      setSaving(false);
      setPendingValues(null);
    }, 300);
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
        description="Your display name and contact preferences update immediately across the app."
        confirmLabel="Save changes"
      />
    </div>
  );
}
