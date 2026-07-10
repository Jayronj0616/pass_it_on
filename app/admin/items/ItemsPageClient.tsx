"use client";

import { useState } from "react";
import { ItemsTable, type AdminItem } from "@/components/admin/ItemsTable";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function ItemsPageClient({
  initialItems,
}: {
  initialItems: AdminItem[];
}) {
  const [items, setItems] = useState<AdminItem[]>(initialItems);
  const [pendingItem, setPendingItem] = useState<AdminItem | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runToggleRemoved() {
    if (!pendingItem) return;
    setWorking(true);
    setError(null);

    const res = await fetch(`/api/admin/items/${pendingItem.id}/remove`, {
      method: "POST",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Something went wrong. Try again.");
      setWorking(false);
      return;
    }

    const { removedByAdmin } = await res.json();

    setItems((prev) =>
      prev.map((item) =>
        item.id === pendingItem.id ? { ...item, removedByAdmin } : item
      )
    );
    setWorking(false);
    setPendingItem(null);
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Items</h1>
      <p className="mt-1 text-sm text-muted">
        Every listing on the platform, regardless of status. Removing an item
        hides it from public browse but keeps the record.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6">
        <ItemsTable
          items={items}
          onToggleRemoved={(id) => {
            const item = items.find((i) => i.id === id);
            if (item) setPendingItem(item);
          }}
        />
      </div>

      <ConfirmModal
        isOpen={pendingItem !== null}
        pending={working}
        onCancel={() => setPendingItem(null)}
        onConfirm={runToggleRemoved}
        title={
          pendingItem?.removedByAdmin
            ? `Restore "${pendingItem?.title}"?`
            : `Remove "${pendingItem?.title}"?`
        }
        description={
          pendingItem?.removedByAdmin
            ? "This item becomes visible in public browse again, if its status still allows it."
            : "This item disappears from public browse immediately. The listing and its history are kept, not deleted."
        }
        confirmLabel={pendingItem?.removedByAdmin ? "Restore" : "Remove"}
        tone={pendingItem?.removedByAdmin ? "default" : "danger"}
      />
    </div>
  );
}
