"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ItemForm, type ItemFormValues } from "@/components/items/ItemForm";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { createClient } from "@/lib/supabase/client";

// Deliberately no outer page chrome (header/max-width wrapper) — unlike the
// consumer NewItemFormClient, this renders inside app/admin/layout.tsx's
// <main> which already provides that. Posts as the admin's own account
// (donator_id = userId, same as the consumer flow) — not on-behalf-of
// another user. Redirects to /admin/items on success, not /dashboard/my-items.
export function AdminNewItemFormClient({ userId }: { userId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingValues, setPendingValues] = useState<ItemFormValues | null>(null);

  function handleFormSubmit(values: ItemFormValues) {
    setPendingValues(values);
  }

  async function confirmPost() {
    if (!pendingValues) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    let photoUrl: string | null = null;

    if (pendingValues.photoFile) {
      const file = pendingValues.photoFile;
      const ext = file.name.split(".").pop();
      const path = `${userId}/${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;

      const { error: uploadError } = await supabase.storage
        .from("item-photos")
        .upload(path, file);

      if (uploadError) {
        setError(uploadError.message);
        setSubmitting(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("item-photos").getPublicUrl(path);
      photoUrl = publicUrl;
    }

    const { error: insertError } = await supabase.from("items").insert({
      title: pendingValues.title,
      description: pendingValues.description,
      photo_url: photoUrl,
      donator_id: userId,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setPendingValues(null);
    router.push("/admin/items");
    router.refresh();
  }

  return (
    <div>
      <Link href="/admin/items" className="text-sm font-semibold text-muted hover:text-ink">
        ← Back to items
      </Link>

      <h1 className="mt-4 text-2xl font-extrabold text-ink">Post an item</h1>
      <p className="mt-1 text-sm text-muted">
        Posted under your admin account, same as any other listing.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="card-shadow mt-6 max-w-xl rounded-2xl border border-border bg-surface p-6">
        <ItemForm onSubmit={handleFormSubmit} submitting={submitting} />
      </div>

      <ConfirmModal
        isOpen={pendingValues !== null}
        pending={submitting}
        onCancel={() => setPendingValues(null)}
        onConfirm={confirmPost}
        title="Post this item?"
        description={`"${pendingValues?.title}" will become visible to everyone browsing PassItOn right away.`}
        confirmLabel="Post item"
      />
    </div>
  );
}
