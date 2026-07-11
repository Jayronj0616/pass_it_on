"use client";

import { useRef, useState } from "react";
import Image from "next/image";

export function MessageComposer({
  onSend,
  locked,
  lockedReason,
}: {
  onSend: (body: string, imageFile: File | null) => Promise<void>;
  locked: boolean;
  lockedReason?: string;
}) {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSend = (text.trim().length > 0 || imageFile !== null) && !sending;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    await onSend(text.trim(), imageFile);
    setText("");
    clearImage();
    setSending(false);
  }

  if (locked) {
    return (
      <div className="border-t border-border bg-gray-bg px-4 py-3 text-center text-xs font-medium text-muted">
        {lockedReason ?? "This conversation is closed."}
      </div>
    );
  }

  return (
    <div className="border-t border-border p-3">
      {imagePreview && (
        <div className="relative mb-2 h-16 w-16 overflow-hidden rounded-lg border border-border">
          <Image src={imagePreview} alt="Selected photo" fill className="object-cover" />
          <button
            type="button"
            onClick={clearImage}
            className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-[10px] text-white"
            aria-label="Remove photo"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="chat-image-input"
        />
        <label
          htmlFor="chat-image-input"
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-gray-bg hover:text-ink"
          aria-label="Attach a photo"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 15-5-5L5 21" />
          </svg>
        </label>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={1}
          placeholder="Write a message..."
          className="max-h-32 flex-1 resize-none rounded-lg border border-border bg-page p-2.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="h-10 shrink-0 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
