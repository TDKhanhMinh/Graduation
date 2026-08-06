import { describe, expect, it } from "vitest"

import {
  WELCOME_ANCHORS,
  createWelcomeViewModel,
  formatCountdown,
  formatWelcomeDate,
  getWelcomePresentation,
  getWelcomeSessionKey,
  resolveWelcomeDeepLink,
  resolveWelcomeStatus,
} from "./welcome"

const now = new Date("2026-08-06T05:00:00.000Z")

describe("Welcome event contract", () => {
  it("resolves archived before any public presentation state", () => {
    expect(resolveWelcomeStatus({ archived_at: "2026-08-01T00:00:00.000Z", event_date: "2026-08-10T00:00:00.000Z" }, now)).toBe("archived")
  })

  it("resolves closed events without inferring an ended date", () => {
    expect(resolveWelcomeStatus({ submission_mode: "closed", event_date: "2026-08-10T00:00:00.000Z" }, now)).toBe("closed")
  })

  it("resolves upcoming events only when the date is valid and in the future", () => {
    expect(resolveWelcomeStatus({ event_date: "2026-08-06T06:00:00.000Z" }, now)).toBe("upcoming")
    expect(resolveWelcomeStatus({ event_date: "not-a-date" }, now)).toBe("live")
  })

  it("resolves current and missing-date events as live", () => {
    expect(resolveWelcomeStatus({ event_date: "2026-08-06T05:00:00.000Z" }, now)).toBe("live")
    expect(resolveWelcomeStatus({}, now)).toBe("live")
  })

  it("only exposes a countdown target for upcoming events", () => {
    expect(createWelcomeViewModel({ event_date: "2026-08-06T06:00:00.000Z" }, now)).toMatchObject({
      status: "upcoming",
      countdownTarget: "2026-08-06T06:00:00.000Z",
      canSubmitWish: true,
      anchors: WELCOME_ANCHORS,
    })
    expect(createWelcomeViewModel({ submission_mode: "closed" }, now).countdownTarget).toBeNull()
  })

  it("clamps expired countdowns at zero instead of producing negative values", () => {
    expect(formatCountdown("2026-08-06T04:59:59.000Z", now)).toEqual({
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    })
  })

  it("formats countdown boundaries deterministically", () => {
    expect(formatCountdown("2026-08-07T06:01:02.000Z", now)).toEqual({
      totalMs: 90_062_000,
      days: 1,
      hours: 1,
      minutes: 1,
      seconds: 2,
    })
    expect(formatCountdown("not-a-date", now)).toBeNull()
    expect(formatCountdown(null, now)).toBeNull()
  })

  it("uses one timezone for the server-rendered date fallback", () => {
    expect(formatWelcomeDate("2026-08-06T23:30:00-04:00")).toBe("August 7, 2026")
    expect(formatWelcomeDate("not-a-date")).toBeNull()
  })

  it("provides distinct presentation copy for upcoming, live, and closed states", () => {
    expect(getWelcomePresentation("upcoming")).toMatchObject({
      badge: "Sắp diễn ra",
      primaryLabel: "Gửi lời chúc sớm",
      primaryTarget: WELCOME_ANCHORS.wish,
    })
    expect(getWelcomePresentation("live")).toMatchObject({
      badge: "Đang diễn ra",
      primaryLabel: "Gửi lời chúc ngay",
    })
    expect(getWelcomePresentation("closed")).toMatchObject({
      badge: "Đã kết thúc",
      primaryLabel: "Xem lại lời chúc",
      canSubmitWish: false,
    })
  })

  it("scopes first-visit storage by event slug", () => {
    expect(getWelcomeSessionKey("graduation-2026")).toBe("event-welcomed:graduation-2026")
  })
})

describe("Welcome deep links", () => {
  it("resolves action=wish to the composer and skips the intro", () => {
    expect(resolveWelcomeDeepLink({ search: "?action=wish" })).toEqual({
      action: "wish",
      target: WELCOME_ANCHORS.wish,
      skipIntro: true,
    })
  })

  it("gives the explicit query action precedence over a hash", () => {
    expect(resolveWelcomeDeepLink({ search: "?action=wish", hash: "#gallery" })).toEqual({
      action: "wish",
      target: WELCOME_ANCHORS.wish,
      skipIntro: true,
    })
  })

  it("supports stable composer and gallery hashes", () => {
    expect(resolveWelcomeDeepLink({ hash: "#submit-wish" }).target).toBe(WELCOME_ANCHORS.wish)
    expect(resolveWelcomeDeepLink({ hash: "#gallery" }).target).toBe(WELCOME_ANCHORS.gallery)
  })

  it("does not skip the intro for an unrelated URL", () => {
    expect(resolveWelcomeDeepLink({ search: "?ref=qr", hash: "#unknown" })).toEqual({
      action: null,
      target: null,
      skipIntro: false,
    })
  })
})
