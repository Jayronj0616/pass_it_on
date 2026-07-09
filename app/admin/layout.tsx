import { AdminSidebar } from "@/components/admin/AdminSidebar";

// TODO: gate this layout on profiles.is_admin once real auth is wired up.
// Server-side check only — never trust a client-side flag for admin access.
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
