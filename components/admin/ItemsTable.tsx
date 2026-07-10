"use client";

import Link from "next/link";
import { StatusTag } from "@/components/items/StatusTag";

export type AdminItem = {
  id: string;
  title: string;
  donatorName: string;
  status: "available" | "reserved" | "completed";
  removedByAdmin: boolean;
  inquiryCount: number;
  createdAt: string;
};

export function ItemsTable({
  items,
  onToggleRemoved,
}: {
  items: AdminItem[];
  onToggleRemoved: (itemId: string) => void;
}) {
  return (
    <div className="card-shadow overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
            <th className="px-5 py-3">Item</th>
            <th className="px-5 py-3">Donator</th>
            <th className="px-5 py-3">Posted</th>
            <th className="px-5 py-3">Inquiries</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border last:border-b-0">
              <td className="px-5 py-3">
                <Link
                  href={`/items/${item.id}`}
                  className="font-semibold text-ink hover:underline"
                >
                  {item.title}
                </Link>
              </td>
              <td className="px-5 py-3 text-ink">{item.donatorName}</td>
              <td className="px-5 py-3 text-muted">{item.createdAt}</td>
              <td className="px-5 py-3 text-ink">{item.inquiryCount}</td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <StatusTag status={item.status} />
                  {item.removedByAdmin && (
                    <span className="inline-flex items-center rounded-full bg-amber-bg px-2.5 py-1 text-xs font-semibold text-amber-text">
                      Removed
                    </span>
                  )}
                </div>
              </td>
              <td className="px-5 py-3 text-right">
                <button
                  onClick={() => onToggleRemoved(item.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    item.removedByAdmin
                      ? "bg-ink text-white hover:bg-ink/90"
                      : "text-muted hover:bg-gray-bg hover:text-ink"
                  }`}
                >
                  {item.removedByAdmin ? "Restore" : "Remove"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
