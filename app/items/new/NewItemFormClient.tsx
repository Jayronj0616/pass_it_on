"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ItemForm, type ItemFormValues } from "@/components/items/ItemForm";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { createClient } from "@/lib/supabase/client";

export function NewItemFormClient({ userId }: { userId: string }) {
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
    router.push("/dashboard/my-items");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="text-xl font-extrabold tracking-tight text-ink"
          >
            PassItOn
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
        <Link href="/" className="text-sm font-semibold text-muted hover:text-ink">
          ← Back to browse
        </Link>

        <h1 className="mt-4 text-2xl font-extrabold text-ink">Post an item</h1>
        <p className="mt-1 text-sm text-muted">
          Someone out there needs exactly this. Add a few details to get
          started.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="card-shadow mt-6 rounded-2xl border border-border bg-surface p-6">
          <ItemForm onSubmit={handleFormSubmit} submitting={submitting} />
        </div>
      </main>

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
