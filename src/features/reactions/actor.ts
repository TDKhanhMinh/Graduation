import "server-only"
import { cookies } from "next/headers"
import crypto from "crypto"
import { verifySession } from "@/lib/auth/dal"

type ReactionActorOptions = {
  persistGuestCookie?: boolean
}

const guestCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 365,
}

export async function getReactionActor(
  options: ReactionActorOptions = {}
): Promise<{ actorId: string | null; actorKeyHash: string | null }> {
  const persistGuestCookie = options.persistGuestCookie ?? true

  const session = await verifySession()
  if (session) {
    return { actorId: session.userId, actorKeyHash: null }
  }

  const cookieStore = await cookies()
  let guestId = cookieStore.get("reaction_guest_id")?.value
  let guestSig = cookieStore.get("reaction_guest_sig")?.value
  const secret = process.env.REACTION_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!secret) throw new Error("Missing secret key for guest reactions")

  const issueGuestIdentity = () => {
    guestId = crypto.randomUUID()
    guestSig = crypto.createHmac("sha256", secret).update(guestId).digest("hex")

    if (persistGuestCookie) {
      cookieStore.set("reaction_guest_id", guestId, guestCookieOptions)
      cookieStore.set("reaction_guest_sig", guestSig, guestCookieOptions)
    }
  }

  if (!guestId || !guestSig) {
    issueGuestIdentity()
  } else {
    const expectedSig = crypto.createHmac("sha256", secret).update(guestId).digest("hex")
    if (expectedSig !== guestSig) {
      issueGuestIdentity()
    }
  }

  const actorKeyHash = crypto.createHash("sha256").update(guestId + secret).digest("hex")
  return { actorId: null, actorKeyHash }
}