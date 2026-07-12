// Compact reputation pill for the abuse-prevention use case (see SYSTEM.md
// §12b) — shows lifetime donated/received totals at a glance, with the
// last-7-days counts available on hover via the native title tooltip
// (deliberately not a custom tooltip component — keeps this cheap to drop
// anywhere a display_name shows without pulling in extra UI machinery).
export function ReputationBadge({
  donatedTotal,
  donatedRecent,
  receivedTotal,
  receivedRecent,
}: {
  donatedTotal: number | null;
  donatedRecent: number | null;
  receivedTotal: number | null;
  receivedRecent: number | null;
}) {
  const dTotal = donatedTotal ?? 0;
  const dRecent = donatedRecent ?? 0;
  const rTotal = receivedTotal ?? 0;
  const rRecent = receivedRecent ?? 0;

  return (
    <span
      title={`${dRecent} given in the last 7 days · ${rRecent} received in the last 7 days`}
      className="inline-flex items-center gap-1 rounded-full bg-gray-bg px-2 py-0.5 text-[11px] font-medium text-gray-text"
    >
      {dTotal} given
      <span aria-hidden="true">·</span>
      {rTotal} received
    </span>
  );
}
