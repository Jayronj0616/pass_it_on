"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Bell icon + unread badge for the AdminSidebar. Fires for every item
// posted, including an admin's own (confirmed). Real-time via the same
// postgres_changes pattern messaging already uses (see
// MessagesPageClient.tsx) — one INSERT subscription on `items`.
export function NotificationBell({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      setUserId(user.id);

      // get_admin_last_read() creates the row (defaulted to "now") on first
      // call for a brand-new admin, so a fresh admin never sees every item
      // ever posted as unread — see 0011_admin_notifications.sql.
      const { data: lastRead, error: rpcError } = await supabase.rpc(
        "get_admin_last_read"
      );

      if (cancelled || rpcError || !lastRead) return;

      const { count } = await supabase
        .from("items")
        .select("id", { count: "exact", head: true })
        .gt("created_at", lastRead);

      if (!cancelled) {
        setUnreadCount(count ?? 0);
      }
    }

    init();

    const channel = supabase
      .channel("admin-item-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "items" },
        () => {
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleClick() {
    const supabase = createClient();

    if (userId) {
      await supabase
        .from("admin_notification_reads")
        .update({ last_read_at: new Date().toISOString() })
        .eq("admin_id", userId);
    }

    setUnreadCount(0);
    router.push("/admin/items");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={unreadCount > 0 ? `${unreadCount} new items posted` : "Notifications"}
      className={`relative flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
