import "server-only"
import { cookies } from "next/headers"

import { verifySession } from "@/lib/auth/dal"

import {
  REACTION_GUEST_COOKIE_MAX_AGE_SECONDS,
  REACTION_GUEST_COOKIE_NAME,
  resolveReactionActor,
} from "./guest-identity"
import { getReactionCookieSecrets } from "./reaction-env"

type ReactionActorOptions = {
  persistGuestCookie?: boolean
}

const guestCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: REACTION_GUEST_COOKIE_MAX_AGE_SECONDS,
  path: "/",
}

export async function getReactionActor(
  options: ReactionActorOptions = {},
): Promise<{ actorId: string | null; actorKeyHash: string | null }> {
  const persistGuestCookie = options.persistGuestCookie ?? true

  const session = await verifySession()
  if (session) {
    return { actorId: session.userId, actorKeyHash: null }
  }

  const cookieStore = await cookies()
  const actor = resolveReactionActor({
    cookieValue: cookieStore.get(REACTION_GUEST_COOKIE_NAME)?.value,
    secrets: getReactionCookieSecrets(),
    persistGuestCookie,
  })

  if (persistGuestCookie && actor.cookieValue) {
    cookieStore.set(REACTION_GUEST_COOKIE_NAME, actor.cookieValue, guestCookieOptions)
    cookieStore.set("reaction_guest_id", "", { ...guestCookieOptions, maxAge: 0 })
    cookieStore.set("reaction_guest_sig", "", { ...guestCookieOptions, maxAge: 0 })
  }

  return { actorId: actor.actorId, actorKeyHash: actor.actorKeyHash }
}
