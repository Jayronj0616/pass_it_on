import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeTime } from "@/lib/utils/format";
import { ItemDetailClient } from "./ItemDetailClient";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: item, error: itemError }, { data: userData }] =
    await Promise.all([
      supabase.from("items").select("*").eq("id", id).single(),
      supabase.auth.getUser(),
    ]);

  if (itemError || !item) {
    notFound();
  }

  const { data: donator } = await supabase
    .from("public_profiles")
    .select("display_name")
    .eq("id", item.donator_id)
    .single();

  let isAdmin = false;
  if (userData.user) {
    const { data: viewerProfile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userData.user.id)
      .single();
    isAdmin = viewerProfile?.is_admin === true;
  }

  return (
    <ItemDetailClient
      item={{
        id: item.id,
        title: item.title,
        description: item.description,
        photoUrl: item.photo_url,
        status: item.status,
        inquiryCount: item.inquiry_count,
        donatorName: donator?.display_name ?? "Unknown",
        postedAt: formatRelativeTime(item.created_at),
      }}
      userId={userData.user?.id ?? null}
      isAdmin={isAdmin}
    />
  );
}
