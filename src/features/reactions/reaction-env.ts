import "server-only"

import { z } from "zod"

import { createError } from "@/lib/observability/error"

import type { ReactionCookieSecrets } from "./guest-identity"

const reactionSecretSchema = z.object({
  REACTION_SECRET_KEY: z.string().min(32),
  REACTION_PREVIOUS_SECRET_KEY: z.string().min(32).optional(),
})

export function getReactionCookieSecrets(
  environment: NodeJS.ProcessEnv = process.env,
): ReactionCookieSecrets {
  const parsed = reactionSecretSchema.safeParse({
    REACTION_SECRET_KEY: environment.REACTION_SECRET_KEY,
    REACTION_PREVIOUS_SECRET_KEY: environment.REACTION_PREVIOUS_SECRET_KEY,
  })

  if (!parsed.success) {
    throw createError(
      "INTERNAL_SERVER_ERROR",
      "Reaction service is temporarily unavailable.",
    )
  }

  return {
    current: parsed.data.REACTION_SECRET_KEY,
    previous: parsed.data.REACTION_PREVIOUS_SECRET_KEY,
  }
}
