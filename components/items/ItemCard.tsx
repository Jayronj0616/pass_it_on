import Image from "next/image";
import Link from "next/link";
import { StatusTag } from "./StatusTag";

export type ItemCardData = {
  id: string;
  title: string;
  description: string;
  photoUrl: string | null;
  status: "available" | "reserved" | "completed";
  inquiryCount: number;
};

export function ItemCard({ item }: { item: ItemCardData }) {
  return (
    <Link
      href={`/items/${item.id}`}
      className="card-shadow group block rounded-2xl border border-border bg-surface p-3 transition-shadow hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.08)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-bg">
        {item.photoUrl ? (
          <Image
            src={item.photoUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted">
            No photo
          </div>
        )}
        <div className="absolute left-3 top-3">
          <StatusTag status={item.status} />
        </div>
      </div>

      <div className="pt-3">
        <h3 className="text-[17px] font-bold leading-snug text-ink">
          {item.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted">
          {item.description}
        </p>
        <p className="mt-2 text-xs font-medium text-muted">
          {item.inquiryCount === 0
            ? "No inquiries yet"
            : `${item.inquiryCount} ${item.inquiryCount === 1 ? "inquiry" : "inquiries"}`}
        </p>
      </div>
    </Link>
  );
}
