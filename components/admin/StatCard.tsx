export function StatCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
}) {
  return (
    <div className="card-shadow rounded-2xl border border-border bg-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-2 text-3xl font-extrabold text-ink">{value}</p>
      {sublabel && <p className="mt-1 text-xs font-medium text-muted">{sublabel}</p>}
    </div>
  );
}
