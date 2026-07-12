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
- `/` (marketing landing page) — **verified since original write-up.** `tsc` clean, spot-checked working (not part of a full systematic click-through, see SYSTEM.md §13). Structure as of this update: two-column hero (headline/CTA left, `HeroCarousel` right on `lg:` and up, stacks to one column on mobile) — restructured from the original single centered column after user feedback that plain-text felt undistinctive. `HeroCarousel.tsx` auto-advances every 5s, pauses on hover, merges 3 static marketing photos (`public/landing/`) with up to 6 real posted item photos (fetched client-side, `status = 'available'`, newest first) — real slides link to `/items/[id]`, static ones don't. Below the hero: `LandingSections.tsx` ("How it actually works", 3 cards using the real `available → reserved → completed` status machine + `StatusTag`, scroll-animated via Framer Motion's `whileInView`) straight into a "Ready to pass something on?" CTA — no illustration section between them; an earlier hand-drawn SVG illustration was tried, disliked ("looks amateurish"), and removed (file moved to `_deleted/`). `LandingFooter.tsx` closes the page — motto, copyright, real nav links only (Browse/Log in/Sign up), deliberately no invented Privacy/Terms links. Same token system throughout, no new colors/type. Uses `.animate-rise-in` (defined in the original write-up) plus Framer Motion for the scroll-triggered sections — `framer-motion` is a new dependency, not previously listed here.
- `/browse` (browse grid) — moved from `/` earlier, wired to Supabase, unchanged since.
- `/items/[id]` (item detail + inquiry modal) — fully wired (see SYSTEM.md §10). `InquiryModal.tsx` now has a third state beyond logged-out/form/submitted: `UnverifiedState`, shown when logged in but `email_confirmed_at` is null (see SYSTEM.md §14c) — same visual pattern as the existing `LoggedOutState`, with a "Verify email" button linking to `/verify`. The page also shows a `ReputationBadge` next to "Posted by X" (see below).
- `/items/new` (post-item form) — fully wired, redirects to `/verify` if the account isn't email-verified (SYSTEM.md §14c).
- `/dashboard/my-items` (donator view) — fully wired. `InquiryRow.tsx` now shows a `ReputationBadge` next to each inquiry's receiver name (see below).
- `/dashboard/my-inquiries` (receiver view) — fully wired. Deliberately does NOT show `ReputationBadge` — this view never displays another user's `display_name` at all (donator identity stays behind the §5 contact-reveal), so there's nothing to attach a badge to.
- `/messages` (chat inbox) — fully wired (SYSTEM.md §12). Deliberately does NOT show `ReputationBadge` in the thread list — you're mid-conversation at that point, not deciding whether to trust a stranger, and the row is visually tight. Split-pane layout (list + thread) collapses to single-pane below `md` (768px) with a back button in `ThreadView`, confirmed working as part of this session's mobile-responsiveness pass.
- `/profile` — fully wired (SYSTEM.md §10).
- `/login`, `/signup` — both gained a single "Browse without an account" link under the card (deliberately minimal, not the full shared nav or footer, to preserve the focused-auth pattern). Both also now redirect away to `/` if a session already exists (client-side check on mount). Signup additionally does a live debounced username-availability check (SYSTEM.md §14a) and, on success, redirects to `/verify` instead of showing an inline message. Both pages have a loading state on submit and a "taking longer than expected" message if the request is still in flight after 5 seconds.
- `/verify` — **new, not in original scope.** Email OTP verification page (SYSTEM.md §14c). Same visual pattern as `/login`/`/signup` (centered card, `card-shadow`, same form field styling). 6-digit numeric code input, resend button with a 30s cooldown, friendly error copy for expired/invalid codes.

**New shared layout:** `app/(app)/layout.tsx` — one nav bar for every consumer page listed above except `/`, `/login`, `/signup`, `/verify`. Session-aware (Log in/Sign up when logged out, full nav when logged in). Now responsive: desktop nav (`hidden md:flex`) unchanged, `components/nav/MobileNavDrawer.tsx` added for `md:hidden` — burger icon, right-side slide-out drawer, same links, closes on link-click or backdrop-click.

**Sign-out** now requires confirmation everywhere it appears (consumer nav, mobile drawer, admin sidebar) — `SignOutButton.tsx` opens a custom modal (matches the app's existing modal pattern: `card-shadow`, `rounded-2xl`, `border-border`, backdrop-dismiss) instead of firing immediately. Shows a loading state ("Logging out...") and a 5-second "taking longer than expected" message on the confirm button while the request is in flight.

**New component: `ReputationBadge`** (`components/profile/ReputationBadge.tsx`) — shows a user's donated/received counts (total + last-7-days) next to their `display_name` wherever it's genuinely useful for trust decisions (item detail's "Posted by", dashboard inquiry rows) but deliberately not everywhere the name appears (see per-screen notes above). Hover shows a tooltip with the recent-count breakdown. Same token system, no new colors.

Admin (`/admin/*`), same tokens but distinct chrome — fixed sidebar using `--color-ink` as background instead of the light surface, since a persistent dark sidebar is a standard way to visually separate an admin area without introducing new colors:
- `/admin` — dashboard: stat cards + recent activity feed
- `/admin/accounts` — all accounts table, suspend/reinstate
- `/admin/items` — all items table, remove/restore (independent of item status — see SYSTEM.md §9)
- `/admin/inquiries` — all inquiries table, force-close
- `/admin/reports` — **new, not in original scope.** Report queue (flagged items, reason + optional note), resolve action clears the queue entry only — actually removing the item still goes through `/admin/items`. Same table visual pattern as the other admin list pages.

**Admin sidebar is now responsive:** `AdminSidebar.tsx` restructured — desktop `<aside>` unchanged, now `hidden md:flex`. New `md:hidden` sticky top bar (burger + "PassItOn Admin" label) plus a right-side slide-out drawer reusing the same nav-links logic, same visual pattern as the consumer `MobileNavDrawer`.

## Screens not yet designed

None remaining from the original scope. Everything above is UI-only against mock/local state — the next phase is backend wiring (see SYSTEM.md and TASK.md), not new screens, unless new functionality gets scoped.

When building anything new, reuse the tokens above — the direction is locked in after two rounds of iteration, don't re-run the brainstorm again without a specific reason.
