export function HandoffIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* left hand, open, giving */}
      <path
        d="M40 120c0-8 4-15 10-19l14-9a10 10 0 0 1 11 0l3 2"
        stroke="var(--color-ink)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M30 128c-4-3-6-8-6-13 0-9 6-16 15-18l20-4a12 12 0 0 1 9 2"
        stroke="var(--color-ink)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="26" cy="118" r="14" fill="var(--color-gray-bg)" stroke="var(--color-border)" strokeWidth="2" />

      {/* right hand, open, receiving */}
      <path
        d="M280 120c0-8-4-15-10-19l-14-9a10 10 0 0 0-11 0l-3 2"
        stroke="var(--color-ink)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M290 128c4-3 6-8 6-13 0-9-6-16-15-18l-20-4a12 12 0 0 0-9 2"
        stroke="var(--color-ink)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="294" cy="118" r="14" fill="var(--color-gray-bg)" stroke="var(--color-border)" strokeWidth="2" />

      {/* the item passing between them — a simple rounded box */}
      <rect
        x="132"
        y="66"
        width="56"
        height="44"
        rx="8"
        fill="var(--color-surface)"
        stroke="var(--color-ink)"
        strokeWidth="4"
      />
      <path d="M132 84h56" stroke="var(--color-ink)" strokeWidth="4" />
      <path d="M160 66v44" stroke="var(--color-ink)" strokeWidth="3" opacity="0.4" />

      {/* motion arc suggesting the pass */}
      <path
        d="M96 56c24-20 104-20 128 0"
        stroke="var(--color-green-text)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 10"
        fill="none"
      />
    </svg>
  );
}
