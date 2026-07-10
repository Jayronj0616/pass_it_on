<<<<<<< HEAD
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
=======
import { ItemDetailClient } from "./ItemDetailClient";

// Placeholder — replace with a Supabase query once the DB is wired up:
// select *, profiles.display_name from items join profiles on items.donator_id = profiles.id
// where items.id = params.id
const MOCK_ITEM = {
  id: "1",
  title: "Oak bookshelf, 5 shelves",
  description:
    "Solid oak, a little scuffed on one side but sturdy. About 6 feet tall, 3 feet wide. Moving out at the end of the week so it needs to go — happy to help carry it to a car if you've got one.",
  photoUrl: null as string | null,
  status: "available" as const,
  inquiryCount: 3,
  donatorName: "Mira T.",
  postedAt: "3 days ago",
};

export default function ItemDetailPage() {
  const item = MOCK_ITEM;

  return <ItemDetailClient item={item} />;
>>>>>>> c98a9489027454d730cce406f24e65d63b986d31
}
