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
- `/` (marketing landing page) — **new, not in original scope, unverified.** Added this session, undocumented until now. Shown to everyone, every time — logged-out visitors and logged-in users alike (including right after login/signup), except admins, who are still redirected straight to `/admin`. Two-path hero ("Give something away" / "Find something you need") reflecting the real donator-approval asymmetry from SYSTEM.md §3, not generic marketing copy — chosen after a brainstorm/critique round against the three common generic-AI-landing-page defaults (vague hero copy, meaningless 3-feature-card rows, gratuitous animation). Uses the same tokens as everything else, no new colors/type introduced. Adds one new CSS utility, `.animate-rise-in` (fade + rise on load, respects `prefers-reduced-motion`). **Not yet run through `tsc` or visually tested** — see SYSTEM.md §12a for full detail and what's still outstanding.
- `/browse` (browse grid) — **moved from `/` this session.** Mock data originally in `app/page.tsx`, since wired to Supabase, now living at `app/(app)/browse/page.tsx`. Previously had its own header; header removed in favor of the new shared nav in `app/(app)/layout.tsx`.
- `/items/[id]` (item detail + inquiry modal) — mock data + dev-only login toggle in `ItemDetailClient.tsx`. `InquiryModal.tsx` handles logged-out / form / submitted states. Now under `app/(app)/items/[id]/`; its own header removed (shared nav), "Back to browse" link now correctly points to `/browse` instead of `/`.
- `/items/new` (post-item form) — `ItemForm.tsx`, includes local photo preview via `URL.createObjectURL` (no Storage upload yet). Now under `app/(app)/items/new/`; own header removed, "Back to browse" link fixed to `/browse`.
- `/dashboard/my-items` (donator view) — approve/reject/complete, state mutates locally via `DashboardItemCard.tsx` + `InquiryRow.tsx`. Now under `app/(app)/dashboard/my-items/`; own header removed.
- `/dashboard/my-inquiries` (receiver view) — `MyInquiryCard.tsx`, shows mock contact info once an inquiry is `approved`. Now under `app/(app)/dashboard/my-inquiries/`; own header removed, empty-state "Browse items" link fixed to `/browse`.
- `/messages` (chat inbox) — thread list + thread view, per-inquiry messaging. **Not in the original design scope below** — built later, undocumented until now (see SYSTEM.md §12). Uses the same token system as everything else (bubbles: sent = `--color-ink` bg/white text, received = `--color-gray-bg`), no new tokens introduced. Not confirmed whether this went through the same two-round critique process the rest of the app did. Now under `app/(app)/messages/`; own header removed in favor of shared nav (height calc adjusted so its layout still fits under the new sticky nav bar).
- `/profile` — Now under `app/(app)/profile/`; own header removed.
- `/login`, `/signup` — email/password forms; signup also collects a display name. Stay outside the `(app)` route group — pre-auth pages keep their own minimal header, not the shared logged-in nav.

**New shared layout:** `app/(app)/layout.tsx` — one nav bar for every consumer page listed above except `/`, `/login`, `/signup`. Session-aware (Log in/Sign up when logged out, full nav when logged in). Replaces what used to be 5 separately hand-copied header blocks.

Admin (`/admin/*`), same tokens but distinct chrome — fixed sidebar using `--color-ink` as background instead of the light surface, since a persistent dark sidebar is a standard way to visually separate an admin area without introducing new colors:
- `/admin` — dashboard: stat cards + recent activity feed
- `/admin/accounts` — all accounts table, suspend/reinstate
- `/admin/items` — all items table, remove/restore (independent of item status — see SYSTEM.md §9)
- `/admin/inquiries` — all inquiries table, force-close

## Screens not yet designed

None remaining from the original scope. Everything above is UI-only against mock/local state — the next phase is backend wiring (see SYSTEM.md and TASK.md), not new screens, unless new functionality gets scoped.

When building anything new, reuse the tokens above — the direction is locked in after two rounds of iteration, don't re-run the brainstorm again without a specific reason.
