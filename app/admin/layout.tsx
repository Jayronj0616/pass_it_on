import { AdminSidebar } from "@/components/admin/AdminSidebar";

// Admin gating happens in middleware.ts (matches /admin/* via the matcher
// config there) — logged-out users get sent to /login, non-admins to /.
// Nothing to check here.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 bg-page px-6 py-8 sm:px-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
