import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { asInquiryStatus } from "@/lib/utils/status";
import { MessagesPageClient } from "./MessagesPageClient";
import type { ThreadSummary } from "@/components/messages/ThreadList";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ inquiry?: string }>;
}) {
  const { inquiry: requestedInquiryId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // RLS (inquiries_select_own_or_on_own_item) already scopes this to
  // inquiries the user is a participant in, either as receiver or as the
  // donator of the item — same access rule the rest of the app relies on.
  const { data: inquiryRows } = await supabase
    .from("inquiries")
    .select("id, item_id, receiver_id, status, created_at, items(id, title, photo_url, donator_id)")
    .order("created_at", { ascending: false });

  const inquiries = inquiryRows ?? [];

  const otherUserIds = [
    ...new Set(
      inquiries
        .map((row) =>
          row.receiver_id === user.id ? row.items?.donator_id : row.receiver_id,
        )
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  // Donator/receiver display names must come from public_profiles, not
  // profiles directly — profiles has no public SELECT policy (SYSTEM.md
  // §5), same reason app/dashboard/my-items/page.tsx does this.
  const { data: otherProfiles } = otherUserIds.length
    ? await supabase.from("public_profiles").select("id, display_name").in("id", otherUserIds)
    : { data: [] };

  const nameById = new Map((otherProfiles ?? []).map((p) => [p.id, p.display_name]));

  const inquiryIds = inquiries.map((row) => row.id);

  const { data: messageRows } = inquiryIds.length
    ? await supabase
        .from("messages")
        .select("id, inquiry_id, sender_id, body, image_path, created_at")
        .in("inquiry_id", inquiryIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  const { data: readRows } = inquiryIds.length
    ? await supabase
        .from("message_reads")
        .select("inquiry_id, last_read_at")
        .eq("user_id", user.id)
        .in("inquiry_id", inquiryIds)
    : { data: [] };

  const lastReadByInquiry = new Map(
    (readRows ?? []).map((r) => [r.inquiry_id, r.last_read_at]),
  );

  const threads: ThreadSummary[] = inquiries
    .filter((row) => row.items !== null)
    .map((row) => {
      const item = row.items!;
      const otherUserId = row.receiver_id === user.id ? item.donator_id : row.receiver_id;
      const threadMessages = (messageRows ?? []).filter((m) => m.inquiry_id === row.id);
      const lastMessage = threadMessages[threadMessages.length - 1] ?? null;
      const lastReadAt = lastReadByInquiry.get(row.id) ?? null;

      const unreadCount = threadMessages.filter(
        (m) =>
          m.sender_id !== user.id &&
          (!lastReadAt || new Date(m.created_at) > new Date(lastReadAt)),
      ).length;

      const status = asInquiryStatus(row.status);

      return {
        inquiryId: row.id,
        itemId: item.id,
        itemTitle: item.title,
        itemPhotoUrl: item.photo_url,
        otherUserName: nameById.get(otherUserId) ?? "Unknown",
        lastMessagePreview: lastMessage
          ? (lastMessage.body ?? "📷 Photo")
          : "No messages yet",
        lastMessageAt: lastMessage?.created_at ?? row.created_at,
        unreadCount,
        locked: status === "rejected" || status === "closed",
      };
    })
    .sort(
      (a, b) => new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime(),
    );

  const initialSelectedInquiryId =
    requestedInquiryId && threads.some((t) => t.inquiryId === requestedInquiryId)
      ? requestedInquiryId
      : null;

  return (
    <MessagesPageClient
      currentUserId={user.id}
      initialThreads={threads}
      initialSelectedInquiryId={initialSelectedInquiryId}
    />
  );
}
