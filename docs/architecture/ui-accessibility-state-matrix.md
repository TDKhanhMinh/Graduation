# UI accessibility and state matrix

Audit date: 2026-08-11
Scope: landing, auth, public event, wish composer, dashboard, event workspace, settings, moderation, insights, export/print, poster studio/asset library.

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
| Event overview /dashboard/events/[id] | Server boundary | Empty event/capability state | Not-found boundary | Public-link/settings/export actions | getOwnedEventById; owner-only actions | Cards wrap; capability state uses text badge/detail |
| Insights /dashboard/events/[id]/insights | Server boundary | Empty metrics state | Route error boundary | Aggregate metrics and trend tables | Owner event lookup | Metric cards stack; dense trend table uses bounded horizontal scroll |
| Export /dashboard/events/[id]/export | Job/status boundary | No completed export state | Route error boundary | Start, pending, success/download, failure states | Owner export job contract | Controls wrap; status/download remain readable at narrow widths |
| Poster Studio /dashboard/events/[id]/poster-studio | Editor state and asset search | Empty asset library state | Inline asset/upload error | Save, upload, select, delete feedback | Owner event and asset actions | Quick-create mobile path; advanced editor activates at larger widths |
| Event settings /settings, /new | Form pending state | N/A | Inline field/action feedback | Save/created state, archive confirmation | Owner DAL/action contract | Labels, URL state, mobile form layout |
| Moderation /moderation | Loading queue state | Empty queue state | Inline refresh/bulk/media error | Bulk pending/success and pagination | Owner-only moderation RPC and signed media URL | Desktop table + mobile cards, selection labels, destructive confirmation |

## Manual smoke coverage

- Static responsive contracts cover 320px, 375px, 768px, 1024px, 1280px, and 1440px intent across public, dashboard, moderation, composer, insights, export, and poster surfaces; runtime browser confirmation remains environment-dependent.
- Full authenticated keyboard/screen-reader, media, reaction, moderation conflict, export job, and asset-library flows require local Supabase/owner/public fixtures that are not available in this environment.
- Current HEAD exposes owner Insights, Export/Print, and Poster Studio/Asset Library routes; those surfaces must not receive a browser-pass claim until fixture-backed smoke is run.
- Follow-up candidates are limited to environment-backed browser verification, screenshot comparison, and overflow checks at the release matrix widths.
## Memory Bloom UI refresh release matrix (2026-08-05)

| Surface | 320px mobile | 768px tablet | 1440px desktop | Key state/accessibility gate |
| --- | --- | --- | --- | --- |
| Landing + auth | CTA stacks; auth form stays focused; no horizontal overflow | hero and auth shell use balanced two-column spacing | section navigation, mockup, CTA and footer remain visible | labels, focus rings, session-aware CTA, reduced-motion global rule |
| Dashboard + create event | event cards stack; preview follows form; no hover-only action | two-column opportunity where space permits | cover/fallback cards and create preview form a workspace | real-data metrics only, empty/loading, dirty/pending/error feedback |
| Event workspace + theme editor | nav scrolls; preset cards and preview stay within viewport | form/preview remain usable | context header + two-column editor/preview | selected preset, invalid cover, saved/unsaved, pending/error text states |
| Guest event + Wish Composer | event CTA has sticky bottom affordance; composer is full-screen | hero/card content stacks | event hero and composer preview use event tokens | archived/not-found/loading, native dialog focus restore, CAPTCHA/media errors |
| Public Wall | filter/customizer wraps; 9:16 uses bounded scroll area | readable two-column card option | Spotlight/Grid/Photo Focus and safe-area padding | reconnect/offline/empty/media fallback, text status, reduced-motion |
| Moderation | queue becomes cards; bulk bar remains reachable | filters wrap without table dependency | split queue/detail workspace | destructive confirmation, selected count, pending/success/error, keyboard row inspection |
| Insights + export | metric cards stack; status/actions remain reachable | trend table can scroll within its bounded region | cards/table use full workspace width | job status, download/failure feedback, no unbounded page overflow |
| Poster Studio + asset library | quick-create path; asset controls remain touch-sized | editor and library remain usable without clipped controls | advanced editor and library use workspace columns | upload/search/delete states, attribution/asset metadata, reduced motion |

### Release evidence and limitations

- Static validation for this refresh: `npm run test:unit`, `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check` must be run sequentially and recorded in the task note.
- Browser smoke is defined at 320/768/1440 for landing/auth and at the same widths for fixture-backed public, dashboard, theme, moderation and composer routes when local Supabase fixtures are available.
- E2E does not receive a pass claim when Playwright cannot initialize the local Supabase/Docker fixture; record the exact startup error and keep visual/manual coverage explicitly limited.
- Poster Asset Library remains excluded from visual certification until the approved Cloudinary private delivery, metadata, delete/retention, quota and orphan-cleanup contract is verified with fixtures.
