import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminNewItemFormClient } from "./AdminNewItemFormClient";

// Deliberately does NOT check user.email_confirmed_at (unlike the consumer
// /items/new — see §14c). Admin accounts are manually provisioned, not
// signed up through the public flow, and are already behind the stronger
// is_admin check below. middleware.ts also already gates all of /admin/*
// (logged-out -> /login, non-admin -> /), this re-check follows the same
// defense-in-depth pattern as every other admin page/route.
export default async function AdminNewItemPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/");
  }

  return <AdminNewItemFormClient userId={user.id} />;
}
