import { NextRequest, NextResponse } from "next/server"
import { toggleReaction } from "@/features/reactions/dal"
import { rateLimit } from "@/lib/rate-limit"
import { logger, createRequestContext, requestDurationMs } from "@/lib/observability/logger"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  const reqContext = createRequestContext(req.headers)
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1"
    const hashedIp = crypto.createHash("sha256").update(ip + (process.env.REACTION_SECRET_KEY || "salt")).digest("hex")
    
    // Very basic in-memory rate limit for demo/local purposes.
    // In production, should use Redis or similar.
    const rateLimitResult = await rateLimit(hashedIp, "reactions", 10, 60) // 10 reactions per minute
    if (!rateLimitResult.success) {
      logger.request("Reaction rate limited", {
        ...reqContext,
        surface: "route",
        route: "/api/reactions",
        resultCode: "429",
        durationMs: requestDurationMs(reqContext)
      })
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }
    
    const body = await req.json()
    const { wishId, emoji } = body
    
    if (!wishId || !emoji) {
      return NextResponse.json({ error: "Missing wishId or emoji" }, { status: 400 })
    }
    
    const isAdded = await toggleReaction(wishId, emoji)
    
    logger.request("Reaction toggled", {
      ...reqContext,
      surface: "route",
      route: "/api/reactions",
      resultCode: "200",
      durationMs: requestDurationMs(reqContext),
      emoji,
      wishId
    })
    
    return NextResponse.json({ success: true, added: isAdded })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error"
    logger.error("Error toggling reaction", error, {
      ...reqContext,
      surface: "route",
      route: "/api/reactions",
      resultCode: "500"
    })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
