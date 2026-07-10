"use client";

import { useState } from "react";

export type ProfileFormValues = {
  displayName: string;
  email: string;
  phone: string;
  sharePhone: boolean;
};

export function ProfileForm({
  initialValues,
  onSubmit,
  submitting = false,
}: {
  initialValues: ProfileFormValues;
  onSubmit: (values: ProfileFormValues) => void;
  submitting?: boolean;
}) {
  const [displayName, setDisplayName] = useState(initialValues.displayName);
  const [email, setEmail] = useState(initialValues.email);
  const [phone, setPhone] = useState(initialValues.phone);
  const [sharePhone, setSharePhone] = useState(initialValues.sharePhone);

  const canSubmit = displayName.trim().length > 0 && email.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      displayName,
      email,
      phone,
      // A donator's phone is only ever shown to a receiver after inquiry
      // approval (SYSTEM.md §5) — sharePhone forced off if there's no phone
      // to share in the first place.
      sharePhone: phone.trim().length > 0 && sharePhone,
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="profile-name" className="block text-sm font-semibold text-ink">
        Display name
      </label>
      <input
        id="profile-name"
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="e.g. Jayron"
        className="mt-1.5 w-full rounded-lg border border-border bg-page p-3 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
      />
      <p className="mt-1 text-xs text-muted">
        Shown to other users on your listings and inquiries.
      </p>

      <label htmlFor="profile-email" className="mt-4 block text-sm font-semibold text-ink">
        Email
      </label>
      <input
        id="profile-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="mt-1.5 w-full rounded-lg border border-border bg-page p-3 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
      />
      <p className="mt-1 text-xs text-muted">
        Shared with a receiver once you approve their inquiry.
      </p>

      <label htmlFor="profile-phone" className="mt-4 block text-sm font-semibold text-ink">
        Phone
      </label>
      <input
        id="profile-phone"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Optional — e.g. 0917 234 5678"
        className="mt-1.5 w-full rounded-lg border border-border bg-page p-3 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
      />

      <label className="mt-4 flex items-start gap-3 rounded-lg border border-border bg-page p-3">
        <input
          type="checkbox"
          checked={sharePhone}
          disabled={phone.trim().length === 0}
          onChange={(e) => setSharePhone(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-border text-ink focus:ring-1 focus:ring-ink disabled:cursor-not-allowed"
        />
        <span>
          <span className="block text-sm font-semibold text-ink">
            Share my phone number
          </span>
          <span className="block text-xs text-muted">
            {phone.trim().length === 0
              ? "Add a phone number above to enable this."
              : "If off, only your email is shared once you approve an inquiry."}
          </span>
        </span>
      </label>

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="mt-6 w-full rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {submitting ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
