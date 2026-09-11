"use client";

import { useRouter } from "next/navigation";

// Bell icon + unread badge for the AdminSidebar. Purely presentational —
// the unread count and realtime subscription live in useAdminNotifications,
// owned once by AdminSidebar and shared between this component's two
// mounted instances (desktop sidebar + mobile top bar).
export function NotificationBell({
  unreadCount,
  onRead,
  className = "",
}: {
  unreadCount: number;
  onRead: () => void;
  className?: string;
}) {
  const router = useRouter();

  function handleClick() {
    onRead();
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
