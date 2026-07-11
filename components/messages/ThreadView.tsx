"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { MessageBubble, type ChatMessage } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";

export function ThreadView({
  itemId,
  itemTitle,
  otherUserName,
  messages,
  currentUserId,
  locked,
  loading,
  onSend,
  onBack,
}: {
  itemId: string;
  itemTitle: string;
  otherUserName: string;
  messages: ChatMessage[];
  currentUserId: string;
  locked: boolean;
  loading: boolean;
  onSend: (body: string, imageFile: File | null) => Promise<void>;
  onBack: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button
          onClick={onBack}
          className="text-muted hover:text-ink sm:hidden"
          aria-label="Back to conversations"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-5 w-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{otherUserName}</p>
          <Link
            href={`/items/${itemId}`}
            className="truncate text-xs text-muted hover:underline"
          >
            {itemTitle}
          </Link>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {loading ? (
          <p className="pt-8 text-center text-xs text-muted">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="pt-8 text-center text-xs text-muted">
            No messages yet — say hi.
          </p>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUserId}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <MessageComposer
        onSend={onSend}
        locked={locked}
        lockedReason="This inquiry is closed — messaging is no longer available."
      />
    </div>
  );
}
