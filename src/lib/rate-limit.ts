import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

type RateLimitRpcRow = {
  allowed: boolean
  remaining: number
  reset_at: string
}

export type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Consumes a durable, opaque reaction scope through the server-only RPC.
 * scopeHash must already be an HMAC; plaintext IPs and actor identifiers
 * must never reach this function or the database counter.
 */
export async function rateLimit(
  scopeHash: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  // The generated database types are refreshed after the migration applies.
  // Keep this explicit server-only boundary while local Supabase is unavailable.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createAdminClient()
  const { data, error } = await supabase.rpc("consume_reaction_rate_limit", {
    p_scope_hash: scopeHash,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })

  if (error) {
    throw error
  }

  const row: RateLimitRpcRow | undefined = Array.isArray(data) ? data[0] : data
  if (
    !row ||
    typeof row.allowed !== "boolean" ||
    typeof row.remaining !== "number" ||
    typeof row.reset_at !== "string"
  ) {
    throw new Error("Reaction rate limit returned an invalid result")
  }

  return {
    success: row.allowed,
    limit,
    remaining: Math.max(0, row.remaining),
    reset: Date.parse(row.reset_at),
  }
}
