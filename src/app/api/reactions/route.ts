import crypto from "crypto"

import { NextRequest, NextResponse } from "next/server"

import { getReactionActor } from "@/features/reactions/actor"
import { getReactionTargetEventId, toggleReaction } from "@/features/reactions/dal"
import { isAllowedReactionEmoji } from "@/features/reactions/emoji"
import { getReactionCookieSecrets } from "@/features/reactions/reaction-env"
import { rateLimit } from "@/lib/rate-limit"
import { createRequestContext, logger, requestDurationMs } from "@/lib/observability/logger"

const REACTION_ERROR_MESSAGE = "Không thể xử lý phản ứng lúc này."
const INVALID_REACTION_MESSAGE = "Yêu cầu phản ứng không hợp lệ."

export async function POST(req: NextRequest) {
  const reqContext = createRequestContext(req.headers)

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: INVALID_REACTION_MESSAGE }, { status: 400 })
    }

    const wishId = typeof body === "object" && body !== null ? (body as { wishId?: unknown }).wishId : undefined
    const emoji = typeof body === "object" && body !== null ? (body as { emoji?: unknown }).emoji : undefined
    if (typeof wishId !== "string" || !wishId.trim() || !isAllowedReactionEmoji(emoji)) {
      return NextResponse.json({ error: INVALID_REACTION_MESSAGE }, { status: 400 })
    }

    const secrets = getReactionCookieSecrets()
    const actor = await getReactionActor()
    const eventId = await getReactionTargetEventId(wishId.trim())
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1"
    const actorScope = actor.actorId
      ? "user:" + actor.actorId
      : "guest:" + (actor.actorKeyHash ?? "unknown")
    const rateLimitScope = crypto
      .createHmac("sha256", secrets.current)
      .update(
        "reaction-rate-limit:v2:event:" +
          (eventId ?? "unknown") +
          ":actor:" +
          actorScope +
          ":ip:" +
          clientIp +
          ":action:toggle",
      )
      .digest("hex")

    const rateLimitResult = await rateLimit(rateLimitScope, 10, 60)
    if (!rateLimitResult.success) {
      logger.request("Reaction rate limited", {
        ...reqContext,
        surface: "route",
        route: "/api/reactions",
        resultCode: "429",
        durationMs: requestDurationMs(reqContext),
      })
      return NextResponse.json({ error: "Có quá nhiều yêu cầu" }, { status: 429 })
    }

    const isAdded = await toggleReaction(wishId.trim(), emoji, actor)

    logger.request("Reaction toggled", {
      ...reqContext,
      surface: "route",
      route: "/api/reactions",
      resultCode: "200",
      durationMs: requestDurationMs(reqContext),
    })

    return NextResponse.json({ success: true, added: isAdded })
  } catch {
    logger.request("Reaction request failed", {
      ...reqContext,
      surface: "route",
      route: "/api/reactions",
      resultCode: "500",
      durationMs: requestDurationMs(reqContext),
    })
    return NextResponse.json({ error: REACTION_ERROR_MESSAGE }, { status: 500 })
  }
}
