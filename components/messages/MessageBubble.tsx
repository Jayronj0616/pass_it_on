"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { getSignedChatImageUrl } from "@/lib/utils/chatImages";
import { formatMessageTime } from "@/lib/utils/format";

export type ChatMessage = {
  id: string;
  senderId: string;
  body: string | null;
  imagePath: string | null;
  createdAt: string;
};

export function MessageBubble({
  message,
  isOwn,
}: {
  message: ChatMessage;
  isOwn: boolean;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!message.imagePath) return;
    let cancelled = false;
    const supabase = createClient();
    getSignedChatImageUrl(supabase, message.imagePath).then((url) => {
      if (!cancelled) setImageUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [message.imagePath]);

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
          isOwn ? "bg-ink text-white" : "bg-gray-bg text-ink"
        }`}
      >
        {message.imagePath && (
          <div className="relative mb-1 aspect-square w-48 overflow-hidden rounded-lg bg-black/10">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt="Shared photo"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs opacity-60">
                Loading...
              </div>
            )}
          </div>
        )}
        {message.body && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.body}
          </p>
        )}
        <p
          className={`mt-1 text-[10px] font-medium ${
            isOwn ? "text-white/60" : "text-muted"
          }`}
        >
          {formatMessageTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
