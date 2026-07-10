# PassItOn — Design Notes

Status: token system decided (v2), applied across the entire app including admin. All planned screens are built with mock data — nothing is wired to Supabase yet.

## Direction: clean modern-startup (white, bold type, soft shadows)

v1 (thrift-tag/paper-craft aesthetic) was tried and rejected — read as thin/skeletal, too delicate. Replaced with a Linear/Vercel-adjacent direction: white surfaces, bold sans type, soft layered shadows instead of hairline borders doing all the work, rounded corners, pill status badges.

### Color tokens (defined in `app/globals.css`)

| Token | Hex | Use |
|---|---|---|
| `--color-page` | `#FAFAFA` | page background |
| `--color-surface` | `#FFFFFF` | card/panel background |
| `--color-ink` | `#151513` | primary text, headings, primary buttons |
| `--color-muted` | `#6B6B66` | secondary text, metadata |
| `--color-border` | `#E5E5E3` | card borders |
| `--color-green-bg` / `--color-green-text` / `--color-green-border` | `#EAFBF3` / `#0D7A4F` / `#C8F0DD` | "Available" status pill |
| `--color-amber-bg` / `--color-amber-text` / `--color-amber-border` | `#FEF0E6` / `#B54708` / `#FBDCC0` | "Reserved" status pill |
| `--color-gray-bg` / `--color-gray-text` | `#F3F3F1` / `#6B6B66` | "Given away" status pill, image placeholders |

`.card-shadow` utility class in globals.css: `0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.04)` — soft two-layer shadow, use on cards instead of relying on border alone.

### Type

Single family: **Inter**, loaded via `next/font/google` in `app/layout.tsx`. No serif, no mono — that was part of what made v1 feel thin. Bold weights throughout: headings 700-800 (`font-bold`/`font-extrabold`), body/labels 500-600 (`font-medium`/`font-semibold`), never regular 400 for anything that carries visual weight.

### Layout

- Cards: white bg, 1px `--color-border`, `rounded-2xl` (16px), `card-shadow`, hover state deepens the shadow slightly (see `ItemCard.tsx`)
- Buttons: solid `--color-ink` bg + white text for primary actions, `rounded-lg` (8px)
- Status badges: pill-shaped (`rounded-full`), tinted background + colored text (not outlined/rotated like v1)
- Header: sticky, `bg-surface/80` + `backdrop-blur-sm` for a modern floating-header feel

### Signature element: `StatusTag`

`components/items/StatusTag.tsx` — solid pill badge, tinted bg matching status color, bold text. Simpler than v1's rotated paper-tag concept but still color-coded consistently (green=available, amber=reserved, gray=given away). Reuse as-is across all screens that show item status.

## Screens built so far

Consumer-facing:
- `/` (homepage/browse grid) — mock data in `app/page.tsx`
- `/items/[id]` (item detail + inquiry modal) — mock data + dev-only login toggle in `ItemDetailClient.tsx`. `InquiryModal.tsx` handles logged-out / form / submitted states.
- `/items/new` (post-item form) — `ItemForm.tsx`, includes local photo preview via `URL.createObjectURL` (no Storage upload yet)
- `/dashboard/my-items` (donator view) — approve/reject/complete, state mutates locally via `DashboardItemCard.tsx` + `InquiryRow.tsx`
- `/dashboard/my-inquiries` (receiver view) — `MyInquiryCard.tsx`, shows mock contact info once an inquiry is `approved`
- `/login`, `/signup` — email/password forms; signup also collects a display name

Admin (`/admin/*`), same tokens but distinct chrome — fixed sidebar using `--color-ink` as background instead of the light surface, since a persistent dark sidebar is a standard way to visually separate an admin area without introducing new colors:
- `/admin` — dashboard: stat cards + recent activity feed
- `/admin/accounts` — all accounts table, suspend/reinstate
- `/admin/items` — all items table, remove/restore (independent of item status — see SYSTEM.md §9)
- `/admin/inquiries` — all inquiries table, force-close

## Screens not yet designed

None remaining from the original scope. Everything above is UI-only against mock/local state — the next phase is backend wiring (see SYSTEM.md and TASK.md), not new screens, unless new functionality gets scoped.

When building anything new, reuse the tokens above — the direction is locked in after two rounds of iteration, don't re-run the brainstorm again without a specific reason.
