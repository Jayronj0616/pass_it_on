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
}
