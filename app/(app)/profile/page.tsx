import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfilePageClient } from "./ProfilePageClient";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, email, phone, share_phone")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    // profiles row should always exist by the time a session does (see
    // 0003_profile_trigger.sql), so hitting this means something upstream
    // is broken, not a normal "no data yet" case.
    throw new Error("Could not load your profile.");
  }

  return (
    <ProfilePageClient
      userId={user.id}
      initialProfile={{
        displayName: profile.display_name,
        email: profile.email,
        phone: profile.phone ?? "",
        sharePhone: profile.share_phone,
      }}
    />
  );
}
