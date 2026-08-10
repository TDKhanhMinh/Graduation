import { getEventLifecycle } from '@/features/events/schedule'

export const WELCOME_ANCHORS = {
  wish: "submit-wish",
  gallery: "gallery",
} as const

export const WELCOME_TIME_ZONE = "UTC"
export const WELCOME_SESSION_PREFIX = "event-welcomed:"
export const WELCOME_SPLASH_SESSION_PREFIX = "event-welcome:"

export type WelcomeAnchor = (typeof WELCOME_ANCHORS)[keyof typeof WELCOME_ANCHORS]
export type WelcomeAction = "wish" | "gallery"
export type WelcomeEventStatus = "archived" | "upcoming" | "live" | "ended" | "closed"

export type WelcomeStage = "checking" | "idle" | "intro" | "opening" | "open" | "closing" | "closed" | "dismissed"
export type AudioStatus = "idle" | "playing" | "paused" | "blocked" | "error" | "disabled" | "muted" | "unsupported"

export type PublicSafeAudioSource = {
  url: string
  mimeType?: string
  isPublicSafe: boolean
}

export type WelcomeSplashProps = {
  slug: string
  title: string
  coverUrl: string | null
  eventDate: string | null
  description: string | null
  audioSource?: PublicSafeAudioSource | null
  reducedMotion?: boolean
  isOpen: boolean
  onClose: () => void
  onAction?: (action: WelcomeAction) => void
}

export type WelcomeCountdown = {
  totalMs: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

export type WelcomePresentation = {
  badge: string
  badgeTone: "info" | "success" | "warning"
  statusCopy: string
  primaryLabel: string
  primaryTarget: WelcomeAnchor
  canSubmitWish: boolean
}

export type WelcomeEventSource = {
  event_date?: string | null
  starts_at?: string | null
  ends_at?: string | null
  timezone?: string | null
  submission_mode?: string | null
  archived_at?: string | null
}

export type WelcomeViewModel = {
  status: WelcomeEventStatus
  anchors: typeof WELCOME_ANCHORS
  countdownTarget: string | null
  canSubmitWish: boolean
}

export type WelcomeDeepLink = {
  action: WelcomeAction | null
  target: WelcomeAnchor | null
  skipIntro: boolean
}

export function getWelcomeSessionKey(slug: string): string {
  return `${WELCOME_SESSION_PREFIX}${slug}`
}

export function getWelcomeSplashSessionKey(slug: string): string {
  return `${WELCOME_SPLASH_SESSION_PREFIX}${slug}:v1`
}

function isValidDate(value: string | null | undefined): value is string {
  return Boolean(value && Number.isFinite(new Date(value).getTime()))
}

export function formatWelcomeDate(value: string | null | undefined, timezone = WELCOME_TIME_ZONE): string | null {
  if (!isValidDate(value)) return null

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(value))
}

export function formatCountdown(target: string | null | undefined, now: Date = new Date()): WelcomeCountdown | null {
  if (!isValidDate(target)) return null

  const totalMs = Math.max(0, new Date(target).getTime() - now.getTime())
  const totalSeconds = Math.floor(totalMs / 1000)

  return {
    totalMs,
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  }
}

export function resolveWelcomeStatus(
  event: WelcomeEventSource,
  now: Date = new Date(),
): WelcomeEventStatus {
  if (event.archived_at) return "archived"
  if (event.submission_mode === "closed") return "closed"

  const lifecycle = getEventLifecycle(event, now)
  if (lifecycle === "upcoming") return "upcoming"
  if (lifecycle === "ended") return "ended"
  return "live"
}

export function createWelcomeViewModel(
  event: WelcomeEventSource,
  now: Date = new Date(),
): WelcomeViewModel {
  const status = resolveWelcomeStatus(event, now)
  const countdownTarget = event.starts_at ?? event.event_date ?? null

  return {
    status,
    anchors: WELCOME_ANCHORS,
    countdownTarget: status === "upcoming" && isValidDate(countdownTarget) ? countdownTarget : null,
    canSubmitWish: status !== "closed" && status !== "archived",
  }
}

export function getWelcomePresentation(status: WelcomeEventStatus): WelcomePresentation {
  switch (status) {
    case "upcoming":
      return {
        badge: "Sắp diễn ra",
        badgeTone: "info",
        statusCopy: "Sự kiện sắp diễn ra. Bạn có thể gửi lời chúc sớm cho chủ nhân.",
        primaryLabel: "Gửi lời chúc sớm",
        primaryTarget: WELCOME_ANCHORS.wish,
        canSubmitWish: true,
      }
    case "ended":
    case "closed":
      return {
        badge: "Đã kết thúc",
        badgeTone: "warning",
        statusCopy: "Sự kiện đã khép lại. Hãy xem lại những lời chúc đã được chia sẻ.",
        primaryLabel: "Xem lại lời chúc",
        primaryTarget: WELCOME_ANCHORS.gallery,
        canSubmitWish: false,
      }
    case "archived":
      return {
        badge: "Đã lưu trữ",
        badgeTone: "warning",
        statusCopy: "Sự kiện này đã được lưu trữ.",
        primaryLabel: "Xem lại sự kiện",
        primaryTarget: WELCOME_ANCHORS.gallery,
        canSubmitWish: false,
      }
    case "live":
    default:
      return {
        badge: "Đang diễn ra",
        badgeTone: "success",
        statusCopy: "Sự kiện đang diễn ra. Hãy để lại một lời chúc ngay hôm nay.",
        primaryLabel: "Gửi lời chúc ngay",
        primaryTarget: WELCOME_ANCHORS.wish,
        canSubmitWish: true,
      }
  }
}

function normalizeHash(hash: string | null | undefined): WelcomeAction | null {
  const value = hash?.replace(/^#/, "")
  if (value === WELCOME_ANCHORS.wish) return "wish"
  if (value === WELCOME_ANCHORS.gallery) return "gallery"
  return null
}

export function resolveWelcomeDeepLink({
  search = "",
  hash = "",
}: {
  search?: string
  hash?: string
}): WelcomeDeepLink {
  const action = new URLSearchParams(search).get("action")
  const queryAction = action === "wish" || action === "gallery" ? action : null
  const hashAction = normalizeHash(hash)
  const resolvedAction = queryAction ?? hashAction

  return {
    action: resolvedAction,
    target: resolvedAction ? WELCOME_ANCHORS[resolvedAction] : null,
    skipIntro: resolvedAction !== null,
  }
}
