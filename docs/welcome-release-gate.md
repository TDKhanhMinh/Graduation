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