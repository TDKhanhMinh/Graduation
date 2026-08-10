import "server-only"

import { cache } from "react"

import { createAdminClient } from "@/lib/supabase/admin"

import { getReactionActor } from "./actor"
import { isAllowedReactionEmoji } from "./emoji"

export type ReactionActor = {
  actorId: string | null
  actorKeyHash: string | null
}

export async function getReactionTargetEventId(wishId: string): Promise<string | null> {
  // This lookup runs only with the server's service-role client. Its result is
  // immediately HMACed for rate limiting and never returned to the caller.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createAdminClient()
  const { data, error } = await supabase
    .from("wishes")
    .select("event_id")
    .eq("id", wishId)
    .maybeSingle()

  if (error || !data || typeof data.event_id !== "string") {
    return null
  }

  return data.event_id
}

export async function toggleReaction(
  wishId: string,
  emoji: string,
  actor?: ReactionActor,
): Promise<boolean> {
  if (!isAllowedReactionEmoji(emoji)) {
    throw new Error("Invalid emoji")
  }

  const { actorId, actorKeyHash } = actor ?? await getReactionActor()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createAdminClient()

  const { data, error } = await supabase.rpc("toggle_wish_reaction", {
    p_wish_id: wishId,
    p_actor_id: actorId,
    p_actor_key_hash: actorKeyHash,
    p_emoji: emoji,
  })

  if (error) {
    throw error
  }

  return Boolean(data)
}

export type ReactionCount = {
  emoji: string
  count: number
  hasReacted: boolean
}

export const getReactionCounts = cache(async (wishId: string): Promise<ReactionCount[]> => {
  const { actorId, actorKeyHash } = await getReactionActor({ persistGuestCookie: false })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createAdminClient()

  // To avoid exposing actors, we just group by emoji.
  const { data, error } = await supabase
    .from("wish_reactions")
    .select("emoji, actor_id, actor_key_hash")
    .eq("wish_id", wishId)

  if (error) {
    return []
  }

  const counts: Record<string, ReactionCount> = {}

  data.forEach((row: { emoji: string, actor_id: string | null, actor_key_hash: string | null }) => {
    if (!counts[row.emoji]) {
      counts[row.emoji] = { emoji: row.emoji, count: 0, hasReacted: false }
    }
    counts[row.emoji].count++

    if (
      (actorId && row.actor_id === actorId) ||
      (actorKeyHash && row.actor_key_hash === actorKeyHash)
    ) {
      counts[row.emoji].hasReacted = true
    }
  })

  return Object.values(counts)
})
