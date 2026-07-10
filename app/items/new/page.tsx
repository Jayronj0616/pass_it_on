"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ItemForm, type ItemFormValues } from "@/components/items/ItemForm";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function NewItemPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [pendingValues, setPendingValues] = useState<ItemFormValues | null>(null);

  function handleFormSubmit(values: ItemFormValues) {
    setPendingValues(values);
  }

  function confirmPost() {
    if (!pendingValues) return;
    // Placeholder — replace with:
    // 1. upload pendingValues.photoFile to Supabase Storage (if present), get public URL
    // 2. insert into items (title, description, photo_url, donator_id: auth.uid())
    setSubmitting(true);
    console.log("item submitted:", pendingValues);
    setTimeout(() => {
      setSubmitting(false);
      setPendingValues(null);
      router.push("/dashboard/my-items");
    }, 400);
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
