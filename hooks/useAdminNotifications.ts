"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Single shared subscription for the admin "new items" unread badge.
// Previously each NotificationBell instance (desktop sidebar + mobile top
// bar — both always mounted, one just CSS-hidden below/above `md`) ran its
// own fetch and realtime subscription, doubling load on every admin page
// load. Lifted here so AdminSidebar owns one instance and passes the count
// down to two presentational bells.
export function useAdminNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const instanceId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const channelNameRef = useRef(`admin-item-notifications-${instanceId}`);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function fetchUnreadCount(lastRead: string, attempt = 0): Promise<void> {
      const { count, error } = await supabase
        .from("items")
        .select("id", { count: "exact", head: true })
        .gt("created_at", lastRead);

      if (cancelled) return;

      if (error) {
        // Observed: this exact query intermittently 503s in production
        // (Supabase/PostgREST-side, not query-shape related — the same
        // query succeeds instantly via anon/service-role keys run
        // directly). Retry once after a short delay before giving up.
        if (attempt === 0) {
          setTimeout(() => fetchUnreadCount(lastRead, 1), 1500);
        } else {
          console.error("Failed to load admin unread item count:", error);
        }
        return;
      }

      setUnreadCount(count ?? 0);
    }

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

      await fetchUnreadCount(lastRead);
    }

    init();

    const channel = supabase
      .channel(channelNameRef.current)
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

  const markRead = useCallback(async () => {
    const supabase = createClient();

    if (userId) {
      await supabase
        .from("admin_notification_reads")
        .update({ last_read_at: new Date().toISOString() })
        .eq("admin_id", userId);
    }

    setUnreadCount(0);
  }, [userId]);

  return { unreadCount, markRead };
}
