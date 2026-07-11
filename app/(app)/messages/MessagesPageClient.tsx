"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThreadList, type ThreadSummary } from "@/components/messages/ThreadList";
import { ThreadView } from "@/components/messages/ThreadView";
import type { ChatMessage } from "@/components/messages/MessageBubble";

// Shape of a raw `messages` row as delivered by the Realtime payload —
// snake_case, matches the DB row, not the camelCase ChatMessage the UI uses.
type RawMessageRow = {
  id: string;
  inquiry_id: string;
  sender_id: string;
  body: string | null;
  image_path: string | null;
  created_at: string;
};

export function MessagesPageClient({
  currentUserId,
  initialThreads,
  initialSelectedInquiryId,
}: {
  currentUserId: string;
  initialThreads: ThreadSummary[];
  initialSelectedInquiryId: string | null;
}) {
  const router = useRouter();
  const [threads, setThreads] = useState<ThreadSummary[]>(initialThreads);
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(
    initialSelectedInquiryId,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Realtime callback closes over stale state if it reads selectedInquiryId
  // directly — kept in a ref, updated whenever selection changes, so the
  // single mount-time subscription always sees the current value.
  const selectedInquiryIdRef = useRef(selectedInquiryId);
  useEffect(() => {
    selectedInquiryIdRef.current = selectedInquiryId;
  }, [selectedInquiryId]);

  async function markRead(inquiryId: string) {
    const supabase = createClient();
    await supabase.from("message_reads").upsert(
      {
        inquiry_id: inquiryId,
        user_id: currentUserId,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: "inquiry_id,user_id" },
    );
    setThreads((prev) =>
      prev.map((t) => (t.inquiryId === inquiryId ? { ...t, unreadCount: 0 } : t)),
    );
  }

  async function loadMessages(inquiryId: string) {
    setLoadingMessages(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, body, image_path, created_at")
      .eq("inquiry_id", inquiryId)
      .order("created_at", { ascending: true });

    setMessages(
      (data ?? []).map((m) => ({
        id: m.id,
        senderId: m.sender_id,
        body: m.body,
        imagePath: m.image_path,
        createdAt: m.created_at,
      })),
    );
    setLoadingMessages(false);
    markRead(inquiryId);
  }

  function handleSelectThread(inquiryId: string) {
    setSelectedInquiryId(inquiryId);
    router.replace(`/messages?inquiry=${inquiryId}`, { scroll: false });
    loadMessages(inquiryId);
  }

  async function handleSend(body: string, imageFile: File | null) {
    if (!selectedInquiryId) return;
    setSendError(null);
    const supabase = createClient();
    let imagePath: string | null = null;

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${selectedInquiryId}/${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;
      const { error: uploadError } = await supabase.storage
        .from("chat-images")
        .upload(path, imageFile);

      if (uploadError) {
        setSendError(uploadError.message);
        return;
      }
      imagePath = path;
    }

    const { error } = await supabase.from("messages").insert({
      inquiry_id: selectedInquiryId,
      sender_id: currentUserId,
      body: body || null,
      image_path: imagePath,
    });

    // No optimistic append here on purpose — the Realtime INSERT event
    // below appends the sent message too (RLS still lets the sender see
    // their own row), so there's one source of truth for message state
    // instead of reconciling an optimistic copy against the real one.
    if (error) {
      setSendError(error.message);
    }
  }

  useEffect(() => {
    if (initialSelectedInquiryId) {
      loadMessages(initialSelectedInquiryId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("messages-inbox")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as RawMessageRow;
          const isOpenThread = selectedInquiryIdRef.current === row.inquiry_id;

          if (isOpenThread) {
            setMessages((prev) =>
              prev.some((m) => m.id === row.id)
                ? prev
                : [
                    ...prev,
                    {
                      id: row.id,
                      senderId: row.sender_id,
                      body: row.body,
                      imagePath: row.image_path,
                      createdAt: row.created_at,
                    },
                  ],
            );
            if (row.sender_id !== currentUserId) {
              markRead(row.inquiry_id);
            }
          }

          setThreads((prev) =>
            prev.map((t) =>
              t.inquiryId === row.inquiry_id
                ? {
                    ...t,
                    lastMessagePreview: row.body ?? "📷 Photo",
                    lastMessageAt: row.created_at,
                    unreadCount:
                      isOpenThread || row.sender_id === currentUserId
                        ? t.unreadCount
                        : t.unreadCount + 1,
                  }
                : t,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedThread = threads.find((t) => t.inquiryId === selectedInquiryId) ?? null;

  return (
    <div className="flex h-[calc(100vh-73px)] flex-col">
      {sendError && (
        <p className="mx-auto mt-2 w-full max-w-5xl px-4 text-sm text-red-700 sm:px-6">
          {sendError}
        </p>
      )}

      <main className="mx-auto flex w-full max-w-5xl flex-1 overflow-hidden px-0 sm:px-6 sm:py-6">
        <div className="card-shadow flex w-full overflow-hidden rounded-none border border-border bg-surface sm:rounded-2xl">
          <div
            className={`w-full flex-col border-r border-border sm:flex sm:w-80 ${
              selectedInquiryId ? "hidden" : "flex"
            }`}
          >
            <div className="border-b border-border px-4 py-3">
              <h1 className="text-sm font-bold text-ink">Messages</h1>
            </div>
            <ThreadList
              threads={threads}
              selectedInquiryId={selectedInquiryId}
              onSelect={handleSelectThread}
            />
          </div>

          <div className={`flex-1 flex-col sm:flex ${selectedInquiryId ? "flex" : "hidden"}`}>
            {selectedThread ? (
              <ThreadView
                itemId={selectedThread.itemId}
                itemTitle={selectedThread.itemTitle}
                otherUserName={selectedThread.otherUserName}
                messages={messages}
                currentUserId={currentUserId}
                locked={selectedThread.locked}
                loading={loadingMessages}
                onSend={handleSend}
                onBack={() => setSelectedInquiryId(null)}
              />
            ) : (
              <div className="hidden flex-1 items-center justify-center sm:flex">
                <p className="text-sm text-muted">Select a conversation</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
