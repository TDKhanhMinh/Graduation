import "server-only"

import { cache } from "react"

import { createClient } from "@/lib/supabase/server"

export type VerifiedSession = {
  userId: string
  email: string | null
}

export const verifySession = cache(
  async (): Promise<VerifiedSession | null> => {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getClaims()
    const claims = data?.claims
    const subject = claims?.sub

    if (error || !claims || typeof subject !== "string") {
      return null
    }

    return {
      userId: subject,
      email:
        typeof claims.email === "string" ? claims.email : null,
    }
  }
)
