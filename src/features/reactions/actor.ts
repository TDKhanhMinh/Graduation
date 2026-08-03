import "server-only"
import { cookies } from "next/headers"
import crypto from "crypto"
import { verifySession } from "@/lib/auth/dal"

export async function getReactionActor(): Promise<{ actorId: string | null, actorKeyHash: string | null }> {
  // Try authenticated user first
  const session = await verifySession()
  if (session) {
    return { actorId: session.userId, actorKeyHash: null }
  }

  // Fallback to guest cookie
  const cookieStore = await cookies()
  let guestId = cookieStore.get("reaction_guest_id")?.value
  let guestSig = cookieStore.get("reaction_guest_sig")?.value
  
  const secret = process.env.REACTION_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!secret) throw new Error("Missing secret key for guest reactions")
  
  if (!guestId || !guestSig) {
    guestId = crypto.randomUUID()
    guestSig = crypto.createHmac("sha256", secret).update(guestId).digest("hex")
    
    cookieStore.set("reaction_guest_id", guestId, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 })
    cookieStore.set("reaction_guest_sig", guestSig, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 })
  } else {
    // verify sig
    const expectedSig = crypto.createHmac("sha256", secret).update(guestId).digest("hex")
    if (expectedSig !== guestSig) {
      // Invalid signature, generate new
      guestId = crypto.randomUUID()
      guestSig = crypto.createHmac("sha256", secret).update(guestId).digest("hex")
      cookieStore.set("reaction_guest_id", guestId, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 })
      cookieStore.set("reaction_guest_sig", guestSig, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 })
    }
  }

  const actorKeyHash = crypto.createHash("sha256").update(guestId + secret).digest("hex")
  return { actorId: null, actorKeyHash }
}
