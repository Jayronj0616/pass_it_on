"use client";

import { useState } from "react";
import Image from "next/image";

export type ItemFormValues = {
  title: string;
  description: string;
  photoFile: File | null;
};

export function ItemForm({
  onSubmit,
  submitting = false,
}: {
  onSubmit: (values: ItemFormValues) => void;
  submitting?: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const canSubmit = title.trim().length > 0 && description.trim().length > 0;

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ title, description, photoFile });
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="item-photo" className="block text-sm font-semibold text-ink">
        Photo
      </label>
      <label
        htmlFor="item-photo"
        className="mt-1.5 flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-gray-bg text-center transition-colors hover:bg-gray-bg/70"
      >
        {photoPreview ? (
          <div className="relative h-full w-full">
            <Image
              src={photoPreview}
              alt="Item preview"
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="px-4">
            <p className="text-sm font-semibold text-ink">Add a photo</p>
            <p className="mt-1 text-xs text-muted">
              Optional, but items with photos get more inquiries
            </p>
          </div>
        )}
      </label>
      <input
        id="item-photo"
        type="file"
        accept="image/*"
        onChange={handlePhotoChange}
        className="hidden"
      />

      <label htmlFor="item-title" className="mt-6 block text-sm font-semibold text-ink">
        Title
      </label>
      <input
        id="item-title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Oak bookshelf, 5 shelves"
        className="mt-1.5 w-full rounded-lg border border-border bg-page p-3 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
      />

      <label
        htmlFor="item-description"
        className="mt-4 block text-sm font-semibold text-ink"
      >
        Description
      </label>
      <textarea
        id="item-description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={5}
        placeholder="Condition, size, why you're giving it away, pickup details..."
        className="mt-1.5 w-full rounded-lg border border-border bg-page p-3 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
      />

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="mt-6 w-full rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {submitting ? "Posting..." : "Post item"}
      </button>
    </form>
  );
}
