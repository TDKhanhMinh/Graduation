import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { getReactionActor } from "./actor"
import { cache } from "react"

const ALLOWED_EMOJIS = ["❤️", "👍", "🎉", "😂", "🔥", "👏"]

export async function toggleReaction(wishId: string, emoji: string): Promise<boolean> {
  if (!ALLOWED_EMOJIS.includes(emoji)) {
    throw new Error("Invalid emoji")
  }
  
  const { actorId, actorKeyHash } = await getReactionActor()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createAdminClient()
  
  const { data, error } = await supabase.rpc("toggle_wish_reaction", {
    p_wish_id: wishId,
    p_actor_id: actorId,
    p_actor_key_hash: actorKeyHash,
    p_emoji: emoji
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
  const { actorId, actorKeyHash } = await getReactionActor()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createAdminClient()
  
  // To avoid exposing actors, we just group by emoji
  // We can do this via standard query using service role, but we filter what we return.
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
