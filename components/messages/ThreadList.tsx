"use client";

import Image from "next/image";

export type ThreadSummary = {
  inquiryId: string;
  itemId: string;
  itemTitle: string;
  itemPhotoUrl: string | null;
  otherUserName: string;
  lastMessagePreview: string;
  lastMessageAt: string | null;
  unreadCount: number;
  locked: boolean;
};

export function ThreadList({
  threads,
  selectedInquiryId,
  onSelect,
}: {
  threads: ThreadSummary[];
  selectedInquiryId: string | null;
  onSelect: (inquiryId: string) => void;
}) {
  if (threads.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-semibold text-ink">No conversations yet</p>
        <p className="mt-1 text-xs text-muted">
          Send or receive an inquiry to start chatting.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {threads.map((thread) => (
        <button
          key={thread.inquiryId}
          onClick={() => onSelect(thread.inquiryId)}
          className={`flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-gray-bg ${
            selectedInquiryId === thread.inquiryId ? "bg-gray-bg" : ""
          }`}
        >
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-bg">
            {thread.itemPhotoUrl ? (
              <Image
                src={thread.itemPhotoUrl}
                alt={thread.itemTitle}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[9px] text-muted">
                No photo
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p
                className={`truncate text-sm ${
                  thread.unreadCount > 0 ? "font-bold text-ink" : "font-semibold text-ink"
                }`}
              >
                {thread.otherUserName}
              </p>
              {thread.unreadCount > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-ink px-1.5 text-[10px] font-bold text-white">
                  {thread.unreadCount}
                </span>
              )}
            </div>
            <p className="truncate text-xs text-muted">{thread.itemTitle}</p>
            <p
              className={`truncate text-xs ${
                thread.unreadCount > 0 ? "font-semibold text-ink" : "text-muted"
              }`}
            >
              {thread.locked ? "Closed — " : ""}
              {thread.lastMessagePreview}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
