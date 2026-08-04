# UI accessibility and state matrix

Audit date: 2026-08-04  
Scope: landing, auth, public event, wish composer, dashboard, event workspace, settings, moderation.

## Shared rules

- Keyboard focus is visible through focus-visible rings; icon-only controls use aria-label and a tooltip/title where applicable.
- Async feedback uses semantic status/alert regions with live announcements; status badges include text, not color alone.
- The root skip link targets #main-content on all primary page layouts.
- The global reduced-motion rule disables animation and transition duration when prefers-reduced-motion: reduce is active.
- Primary controls use the shared minimum control size and the shared Button primitive avoids transition-all; long content uses min-w-0, truncation, or wrapping.
- Destructive moderation/archive actions require confirmation before the mutation.

## Route matrix

| Surface | Loading | Empty / unavailable | Error | Pending / success | Permission boundary | Responsive / keyboard evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Landing / | Server-rendered shell | N/A | Auth links remain available | Session-aware CTA | verifySession only changes CTA | Skip link, semantic main, responsive CTA stacking |
| Auth /auth/login, /auth/sign-up | Server action button state | N/A | Inline alert linked to invalid fields | status for action message | Server action owns auth decision | Labels, autocomplete, visible focus, keyboard form submission |
| Public /e/[slug] | loading.tsx status skeleton | not-found.tsx, archived state, empty wall | Media/realtime error and retry state | Composer, upload, share, reaction live feedback | Public event lookup, submission mode, media URL policy | Header/content min-w-0, wrapping controls, native dialog focus behavior |
| Wish composer | Step state and upload progress | Media unavailable/removal state | Inline field/submit/media/CAPTCHA errors | Submit pending/success, draft retention | Turnstile and server submit contract remain authoritative | Native modal, focus restore, labels, touch-sized controls |
| Dashboard /dashboard | Server data boundary | Empty event state | Feedback state | Create CTA and action feedback | verifySession redirect | Sidebar/mobile nav, skip link, responsive cards |
| Event overview /dashboard/events/[id] | Server boundary | Capability cards explicitly unavailable | Not-found boundary | Public-link/settings actions | getOwnedEventById; no fake export action | Cards wrap; capability state uses text badge/detail |
| Event settings /settings, /new | Form pending state | N/A | Inline field/action feedback | Save/created state, archive confirmation | Owner DAL/action contract | Labels, URL state, mobile form layout |
| Moderation /moderation | Loading queue state | Empty queue state | Inline refresh/bulk/media error | Bulk pending/success and pagination | Owner-only moderation RPC and signed media URL | Desktop table + mobile cards, selection labels, destructive confirmation |

## Manual smoke coverage

- Viewports checked by production route smoke: 320px, 768px, and 1440px for public fake slug and authenticated-route redirect shells; no horizontal overflow was observed.
- Full authenticated keyboard/screen-reader, media, reaction, moderation conflict, and export-ready flows require local Supabase/owner/public fixtures that are not available in this environment.
- Export remains explicitly unavailable because no owner export route/status/download contract exists in the current repository; no fabricated action is exposed.
- Follow-up candidates are limited to environment-backed browser verification and any future export capability once its contract is present.