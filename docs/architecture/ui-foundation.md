# UI Foundation

Baseline contract for the Graduation Message/Memoria UI refresh. Later UI tasks should reuse these tokens and primitives before adding route-specific styles.

## Principles

- Web-first layout: desktop/laptop is the primary information architecture, with deliberate tablet and mobile simplification and no horizontal overflow at 320px.
- Target breakpoints: large desktop >= 1440px, desktop 1200-1439px, laptop 1024-1199px, tablet 768-1023px, mobile < 768px.
- Desktop baseline: a 1440px content container, 12-column workspace grid, and dense dashboard surfaces; tablet uses 8 columns and mobile uses 4 columns.
- Use semantic tokens instead of route-specific raw colors for surfaces, text, focus and status.
- Every async or conditional route owns an explicit loading, empty, error and success state where applicable.
- Status is communicated with text or icon plus color; color is never the only signal.
- Icon-only controls must expose an accessible name and a visible focus state.
- Respect prefers-reduced-motion for non-essential animation.
- Keep API, auth, RLS, database and data-fetching behavior out of this foundation task.

## Route inventory and state coverage

| Area | Route/file | Current UI evidence | Foundation gap to track |
| --- | --- | --- | --- |
| Marketing | /, src/app/page.tsx | Dark landing page with hero, feature cards and CTA | Uses a separate visual language; no shared page/section contract |
| Authentication | /auth/login, /auth/sign-up, src/components/auth/auth-form.tsx | Custom light form styles, inline error/success feedback | Align tokens, field states, pending state and focus treatment |
| Auth callback | /auth/callback | Route handler only | No visible UI; errors must remain safe and route-level |
| Owner shell | /dashboard, src/app/dashboard/layout.tsx | Header with Dashboard link and logout | Needs navigation context, mobile behavior and shared page gutter |
| Event overview | /dashboard, src/app/dashboard/page.tsx | Event cards and empty state | Needs consistent loading/empty/card/action patterns |
| Event creation | /dashboard/events/new | Event form | Needs grouped form sections, validation hierarchy and pending feedback |
| Event detail | /dashboard/events/[id] | Event page/layout | Needs event workspace context and tab contract |
| Moderation | /dashboard/events/[id]/moderation | Filters, table, bulk actions, pagination, audit | Needs responsive fallback, safe preview and explicit action states |
| Settings | /dashboard/events/[id]/settings | Event settings form/archive control | Needs save/unsaved/error/success and destructive action patterns |
| Public event | /e/[slug] | Header, share control, composer CTA and realtime wall | Needs cover/identity hierarchy, media/filter/share states and responsive wall |
| Public loading/not-found | /e/[slug]/loading.tsx, not-found.tsx | Route states exist | Align copy, spacing and feedback primitive contract |
| Composer | src/components/wish-composer/* | Two-step dialog, draft, upload, audio, AI, CAPTCHA | Needs progress, recovery, focus trap/restore and success/pending states |

## Semantic token contract

Tokens live in src/app/globals.css so they load from the root layout for every App Router route.

| Token | Purpose | Usage rule |
| --- | --- | --- |
| --background, --foreground | Page canvas and default text | Use through bg-background/text-foreground |
| --surface-elevated, --surface-sunken | Card/dialog surface and subdued containers | Use for hierarchy; do not hard-code white/black per route |
| --muted, --muted-foreground | Secondary content and helper text | Maintain readable contrast; do not use for primary actions |
| --status-info | Loading, syncing and informational state | Pair with status text or icon |
| --status-success | Completed/success state | Pair with confirmation copy |
| --status-warning | Pending, attention or reversible risk | Pair with next action or explanation |
| --status-danger | Error/destructive state | Use role="alert" for actionable errors |
| --focus and --focus-ring-width | Keyboard focus visibility | Never remove the focus ring without an equivalent |
| --page-gutter | Responsive horizontal page padding | 1rem mobile, 1.5rem tablet, 2rem desktop/laptop |
| --content-max-width | Shared readable content width | 90rem Web-first baseline; route may narrow for focused flows |
| --grid-columns | Layout planning columns | 4 mobile, 8 tablet, 12 laptop/desktop |
| --hero-heading-size | Public event hero heading scale | 4rem-5.5rem on desktop; scale down by breakpoint |
| --page-heading-size | Route heading scale | 2.25rem-3rem on desktop; scale down by breakpoint |
| --section-heading-size | Section heading scale | 1.625rem-2rem on desktop; scale down by breakpoint |
| --card-padding | Desktop card content padding | 1.25rem-1.5rem; compact only on narrow screens |
| --control-min-size | Minimum touch target | Target 2.75rem for primary/icon controls |

The visual refresh adds a Memory Bloom layer without changing the existing semantic contract:

- Product UI brand tokens are exposed as brand-* and memory-* utilities. Violet is reserved for primary actions and active states; pink, peach and gold are accents.
- Event Experience UI is scoped by .event-theme and data-event-theme values (graduation, editorial, minimal). Event variables must not be applied to dashboard surfaces.
- Event components should use var(--event-*) through event variants rather than hard-coded event colors.
- Motion durations use --motion-fast, --motion-base and --motion-soft; reduced-motion remains mandatory.

Dark mode overrides semantic tokens in .dark. Reduced-motion behavior is defined globally with prefers-reduced-motion.

## Shared primitive contract

| Primitive | File | Contract |
| --- | --- | --- |
| PageShell | src/components/ui/page-shell.tsx | Centered max-width container using shared responsive gutter |
| SectionHeading | src/components/ui/section-heading.tsx | Heading level, optional description and action region; action region wraps on mobile |
| FeedbackState | src/components/ui/feedback-state.tsx | loading, empty, error, success; semantic role and icon; optional action |
| StatusBadge | src/components/ui/status-badge.tsx | Neutral/info/success/warning/danger tone; text remains required |
| IconButton | src/components/ui/icon-button.tsx | Requires label; delegates focus/disabled behavior to the shared Button |
| ConfirmDialog | Later task | Destructive confirmation with focus trap/restore and explicit consequence copy |

Route-specific components may compose these primitives but should not redefine their token or focus semantics.

## State checklist for later tasks

- [ ] Loading: reserved layout or skeleton; no layout jump for primary content.
- [ ] Empty: explains why the area is empty and offers the next useful action.
- [ ] Error: actionable message, retry path where safe, announced to assistive technology.
- [ ] Success: confirms the completed action without relying on toast alone for critical content.
- [ ] Pending: disables duplicate mutation actions and preserves user input/context.
- [ ] Archived/closed/not-found: explains availability and provides safe navigation.
- [ ] Media unavailable: preserves surrounding content and provides fallback copy.
- [ ] Realtime disconnected: visible but non-blocking status with reconnect behavior.

## GM-UI dependency checklist

- [x] GM-UI P0-T01 foundation and inventory (this task).
- [ ] GM-UI P1-T02 app shell/navigation uses PageShell, tokens and IconButton.
- [ ] GM-UI P1-T03 landing/auth uses tokens and explicit form states.
- [ ] GM-UI P2-T04 public wall uses FeedbackState, StatusBadge and responsive gutter.
- [ ] GM-UI P2-T05 composer uses state/focus contracts and reduced-motion behavior.
- [ ] GM-UI P3-T06 through P3-T08 owner workspace uses shared heading, surface and action contracts.
- [ ] GM-UI P4-T09 through P4-T11 closes media/reaction/export, accessibility and regression coverage.

## GM-WF Web-first dependency checklist

- [x] GM-WF P0-T01 foundation contract and breakpoint baseline.
- [ ] GM-WF P1-T02 public event hero and identity.
- [ ] GM-WF P1-T03 responsive wall, masonry and filter contract.
- [ ] GM-WF P2-T04 desktop two-column Wish Composer.
- [ ] GM-WF P3-T05 dashboard desktop workspace.
- [ ] GM-WF P3-T06 moderation table and sticky preview.
- [ ] GM-WF P4-T07 theme editor and live preview.
- [ ] GM-WF P4-T08 Cloudinary Media Library.
- [ ] GM-WF P5-T09 responsive, keyboard and visual release gate.
## Non-goals

This foundation does not change routes, server actions, Supabase queries, permissions, storage, realtime protocol or business copy beyond the contract documentation above.