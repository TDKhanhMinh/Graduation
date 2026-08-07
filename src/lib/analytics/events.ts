"use client"

export const ANALYTICS_CONSENT_KEY = "memoria-analytics-consent"
export const ANALYTICS_ENDPOINT = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT

export type AnalyticsEventName = "landing_visit" | "cta_click" | "sample_event_clicked" | "poster_demo_interaction" | "template_selected" | "template_previewed" | "template_continue" | "section_reached" | "faq_opened" | "first_poster_completed" | "first_event_published" | "event_welcome_viewed" | "event_welcome_submit_clicked" | "event_welcome_explore_clicked" | "event_welcome_scrolled" | "event_welcome_deep_link_skipped"
export type AnalyticsPayload = Record<string, string | number | boolean | null>
export type WelcomeVisit = "first" | "repeat" | "storage-unavailable"
export type WelcomeStatus = "upcoming" | "live" | "closed" | "archived"

export const WELCOME_ANALYTICS_EVENTS = [
  "event_welcome_viewed",
  "event_welcome_submit_clicked",
  "event_welcome_explore_clicked",
  "event_welcome_scrolled",
  "event_welcome_deep_link_skipped",
] as const

export type WelcomeAnalyticsEventName = (typeof WELCOME_ANALYTICS_EVENTS)[number]
export type WelcomeAnalyticsPayload = {
  event_welcome_viewed: { slug: string; status: WelcomeStatus; visit: WelcomeVisit; deep_link_skipped: boolean }
  event_welcome_submit_clicked: { slug: string; status: WelcomeStatus; target: "wish" }
  event_welcome_explore_clicked: { slug: string; status: WelcomeStatus; target: "gallery" }
  event_welcome_scrolled: { slug: string; status: WelcomeStatus; depth: "hero-exited" }
  event_welcome_deep_link_skipped: { slug: string; action: "wish" | "gallery" | "unknown" }
}

const deliveredKeys = new Set<string>()
const forbiddenKeys = new Set(["email", "name", "user_id", "token", "secret", "wish_content", "media_url", "access_token"])

export function isSafeAnalyticsPayload(payload: AnalyticsPayload) {
  return Object.keys(payload).every((key) => !forbiddenKeys.has(key.toLowerCase()) && (payload[key] === null || typeof payload[key] !== "object"))
}

function hasConsent() {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === "granted"
  } catch {
    return false
  }
}

export function track(event: AnalyticsEventName, payload: AnalyticsPayload = {}, options?: { dedupeKey?: string }) {
  if (!isSafeAnalyticsPayload(payload) || !ANALYTICS_ENDPOINT || !hasConsent()) return false
  const key = options?.dedupeKey ? `${event}:${options.dedupeKey}` : undefined
  if (key && deliveredKeys.has(key)) return false
  if (key) deliveredKeys.add(key)
  void fetch(ANALYTICS_ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ event, payload }), keepalive: true }).catch(() => undefined)
  return true
}

export function trackWelcomeEvent<E extends WelcomeAnalyticsEventName>(
  event: E,
  payload: WelcomeAnalyticsPayload[E],
  slug: string,
  options?: { dedupeKey?: string },
) {
  if (typeof window === "undefined") return false
  const suffix = options?.dedupeKey ?? "default"
  const dedupeKey = `welcome:${slug}:${event}:${suffix}`
  const storageKey = `memoria:${dedupeKey}`
  try {
    if (window.sessionStorage.getItem(storageKey)) return false
  } catch {
    // Analytics should remain best-effort when storage is blocked.
  }

  const delivered = track(event, payload, { dedupeKey })
  if (!delivered) return false
  try {
    window.sessionStorage.setItem(storageKey, "1")
  } catch {
    // In-memory dedupe still protects the current page when storage is blocked.
  }
  return true
}

export function resetAnalyticsDedupeForTests() { deliveredKeys.clear() }