import crypto from "crypto"

export const REACTION_GUEST_COOKIE_NAME = "reaction_guest"
export const REACTION_GUEST_COOKIE_VERSION = "v1"
export const REACTION_GUEST_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

export type ReactionCookieSecrets = {
  current: string
  previous?: string
}

export type ReactionActor = {
  actorId: string | null
  actorKeyHash: string | null
}

type VerifiedGuestCookie = {
  actorKeyHash: string
  signedWithPreviousSecret: boolean
}

type ResolvedReactionActor = ReactionActor & {
  cookieValue?: string
}

type ResolveReactionActorOptions = {
  authenticatedUserId?: string | null
  cookieValue?: string
  secrets?: ReactionCookieSecrets
  nowMs?: number
  persistGuestCookie?: boolean
}

function sign(payload: string, secret: string) {
  return crypto
    .createHmac("sha256", secret)
    .update(`reaction-guest:${payload}`)
    .digest("hex")
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "utf8")
  const rightBuffer = Buffer.from(right, "utf8")

  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

function verifyGuestCookie(
  cookieValue: string,
  secrets: ReactionCookieSecrets,
  nowMs: number,
): VerifiedGuestCookie | null {
  const [version, issuedAtValue, guestId, actorKeyHash, signature, ...extra] = cookieValue.split(".")
  const issuedAt = Number(issuedAtValue)
  const nowSeconds = Math.floor(nowMs / 1000)

  if (
    extra.length > 0 ||
    version !== REACTION_GUEST_COOKIE_VERSION ||
    !Number.isSafeInteger(issuedAt) ||
    issuedAt > nowSeconds + 300 ||
    issuedAt + REACTION_GUEST_COOKIE_MAX_AGE_SECONDS <= nowSeconds ||
    !/^[A-Za-z0-9_-]{43}$/.test(guestId ?? "") ||
    !/^[a-f0-9]{64}$/.test(actorKeyHash ?? "") ||
    !/^[a-f0-9]{64}$/.test(signature ?? "")
  ) {
    return null
  }

  const payload = `${version}.${issuedAtValue}.${guestId}.${actorKeyHash}`
  if (safeEqual(sign(payload, secrets.current), signature)) {
    return { actorKeyHash, signedWithPreviousSecret: false }
  }

  if (secrets.previous && safeEqual(sign(payload, secrets.previous), signature)) {
    return { actorKeyHash, signedWithPreviousSecret: true }
  }

  return null
}

function issueGuestCookie(
  secrets: ReactionCookieSecrets,
  nowMs: number,
  existingActorKeyHash?: string,
) {
  const issuedAt = Math.floor(nowMs / 1000)
  const guestId = crypto.randomBytes(32).toString("base64url")
  const actorKeyHash =
    existingActorKeyHash ??
    crypto
      .createHmac("sha256", secrets.current)
      .update(`reaction-actor:${REACTION_GUEST_COOKIE_VERSION}:${guestId}`)
      .digest("hex")
  const payload = `${REACTION_GUEST_COOKIE_VERSION}.${issuedAt}.${guestId}.${actorKeyHash}`

  return {
    actorKeyHash,
    cookieValue: `${payload}.${sign(payload, secrets.current)}`,
  }
}

export function resolveReactionActor({
  authenticatedUserId,
  cookieValue,
  secrets,
  nowMs = Date.now(),
  persistGuestCookie = true,
}: ResolveReactionActorOptions): ResolvedReactionActor {
  if (authenticatedUserId) {
    return { actorId: authenticatedUserId, actorKeyHash: null }
  }

  if (!secrets) {
    throw new Error("Reaction guest identity is unavailable")
  }

  const verified = cookieValue
    ? verifyGuestCookie(cookieValue, secrets, nowMs)
    : null

  if (verified) {
    if (persistGuestCookie && verified.signedWithPreviousSecret) {
      const replacement = issueGuestCookie(secrets, nowMs, verified.actorKeyHash)
      return { actorId: null, ...replacement }
    }

    return { actorId: null, actorKeyHash: verified.actorKeyHash }
  }

  if (!persistGuestCookie) {
    return { actorId: null, actorKeyHash: null }
  }

  return { actorId: null, ...issueGuestCookie(secrets, nowMs) }
}
