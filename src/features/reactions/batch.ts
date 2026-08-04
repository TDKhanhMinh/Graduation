import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { getReactionActor } from "./actor"
import type { ReactionCount } from "./dal"

export async function getReactionCountsBatch(wishIds: string[]): Promise<Record<string, ReactionCount[]>> {
  if (wishIds.length === 0) return {}
  
  const { actorId, actorKeyHash } = await getReactionActor({ persistGuestCookie: false })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createAdminClient()
  
  const { data, error } = await supabase
    .from("wish_reactions")
    .select("wish_id, emoji, actor_id, actor_key_hash")
    .in("wish_id", wishIds)
    
  if (error) {
    return {}
  }
  
  const grouped: Record<string, Record<string, ReactionCount>> = {}
  
  data.forEach((row: { wish_id: string, emoji: string, actor_id: string | null, actor_key_hash: string | null }) => {
    if (!grouped[row.wish_id]) {
      grouped[row.wish_id] = {}
    }
    const counts = grouped[row.wish_id]
    
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
  
  const result: Record<string, ReactionCount[]> = {}
  for (const [wishId, counts] of Object.entries(grouped)) {
    result[wishId] = Object.values(counts)
  }
  
  return result
}
