# Welcome Hero release gate

This checklist is the release contract for the public `/e/[slug]` Welcome Hero. Runtime checks must not be marked passed without local Supabase and browser evidence.

## Static and unit gates

- [x] `WelcomeHeroConfig` is validated before public rendering.
- [x] `enabled=false` keeps event identity, status, message and CTA fallback while removing poster/decorative layers.
- [x] CTA, first view, scroll and deep-link skip analytics use typed event names and primitive, non-private payloads.
- [x] Analytics is consent-gated and deduped by event slug, event name and action within the session.
- [x] Missing and invalid poster states preserve gradient/theme fallback.
- [x] Reduced motion, deep-link skip and offscreen/visibility lifecycle remain intact.
- [x] Canonical, visibility, archived/not-found, composer, wall and share/QR paths are outside analytics scope and unchanged.

## Browser matrix (requires Supabase/Docker)

| Viewport | Layout checks |
| --- | --- |
| 320px | No horizontal overflow; poster fallback; CTA targets remain usable and wrap safely. |
| 768px | Poster Focus ordering; keyboard focus; reduced-motion preference. |
| 1024px | Split transition boundary; poster contain/cover treatment. |
| 1440px | Cinematic Split proportions; decorative layers remain bounded and non-interactive. |

| Scenario | Expected evidence |
| --- | --- |
| Upcoming/live/closed/archived | Correct status copy, countdown/CTA fallback, and no route break. |
| First/repeat visit | Session marker changes from first to repeat; view event is deduped per slug. |
| Missing/invalid poster | Theme gradient and identity remain visible; no layout overflow. |
| `?action=wish`, `?action=gallery`, or matching hash | Native anchor remains valid; focus/scroll behavior is preserved; deep-link skip is distinct. |
| Keyboard and reduced motion | CTA/action focus is visible and animation does not block interaction. |

## Current evidence

- Static/unit/typecheck/lint/build gates are recorded on Notion task `[WE-FULL P1-T04]`.
- Browser/Supabase runtime evidence is intentionally pending when Docker is unavailable; do not convert this limitation into a browser pass.

---

# Guided Tour Release Gate

This checklist is the release contract for the Character Guided Tour feature on the public event page.

## Static and unit gates

- [x] Component renders smoothly and prevents auto-start without explicit gesture or when skipping via deep link.
- [x] Local storage respects completed and skipped flags cleanly.
- [x] State interactions are tightly coordinated between `useGuidedTour`, `TourExperience`, `TourPrompt`, and `TourRunner`.
- [x] Missing targets gracefully skip without failing the entire component tree.
- [x] `IntersectionObserver` handles accurate DOM positional rendering and respects reduced motion preferences.
- [x] Sticker API methods (`triggerSpeech`, `triggerAction`) bridge synchronously via `TourStickerBridge`.
- [x] E2E spec (`welcome-tour.spec.ts`) covers the entire user interaction sequence.

## Browser matrix (requires Supabase/Docker)

| Viewport | Layout checks |
| --- | --- |
| 320px | No horizontal overflow; TourPrompt scales correctly; mascot pointer and cards fit on screen. |
| 768px | TourCard layout scales up; prompt remains pinned; scrolling remains smooth. |
| 1440px | Tour Spotlight hole remains crisp; Mascot transitions correctly across wide viewports. |

| Scenario | Expected evidence |
| --- | --- |
| Event states (archived/closed) | Tour stays `skipped`; no auto prompt or execution. |
| Deep links | Skips intro automatically; no prompt rendering. |
| Focus restore | After finishing or skipping, focus correctly shifts back to the prior active DOM element. |
| Keyboard navigation | "Escape" skips the tour; "Tab" follows logical focus trapping within TourCard. |

## Current Evidence
- `npm run test:unit`, `lint`, `typecheck`, `build` all pass securely. These are logged in Notion `[GT-08]`.
- E2E script `welcome-tour.spec.ts` is staged.
- Browser/Supabase execution for E2E is BLOCKED due to Docker/Supabase being unavailable locally. Run `npx playwright test` upon deployment or when local environment is fully spun up to gather browser evidence.