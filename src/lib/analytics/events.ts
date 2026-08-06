"use client"

export const ANALYTICS_CONSENT_KEY = "memoria-analytics-consent"
export const ANALYTICS_ENDPOINT = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT

export type AnalyticsEventName = "landing_visit" | "cta_click" | "sample_event_clicked" | "poster_demo_interaction" | "template_selected" | "template_previewed" | "template_continue" | "section_reached" | "faq_opened" | "first_poster_completed" | "first_event_published"
export type AnalyticsPayload = Record<string, string | number | boolean | null>

const deliveredKeys = new Set<string>()
const forbiddenKeys = new Set(["email", "name", "user_id", "token", "secret", "wish_content", "media_url", "access_token"])

export function isSafeAnalyticsPayload(payload: AnalyticsPayload) {
  return Object.keys(payload).every((key) => !forbiddenKeys.has(key.toLowerCase()) && typeof payload[key] !== "object")
}

function hasConsent() {
  return typeof window !== "undefined" && window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === "granted"
}

export function track(event: AnalyticsEventName, payload: AnalyticsPayload = {}, options?: { dedupeKey?: string }) {
  if (!isSafeAnalyticsPayload(payload) || !ANALYTICS_ENDPOINT || !hasConsent()) return false
  const key = options?.dedupeKey ? `${event}:${options.dedupeKey}` : undefined
  if (key && deliveredKeys.has(key)) return false
  if (key) deliveredKeys.add(key)
  void fetch(ANALYTICS_ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ event, payload }), keepalive: true }).catch(() => undefined)
  return true
}

export function resetAnalyticsDedupeForTests() { deliveredKeys.clear() }
