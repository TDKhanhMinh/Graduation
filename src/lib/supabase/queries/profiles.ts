import "server-only"

import { cache } from "react"

import { verifySession } from "@/lib/auth/dal"
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database"

export type Profile =
  Database["public"]["Tables"]["profiles"]["Row"]

export const getCurrentProfile = cache(
  async (): Promise<Profile | null> => {
    const session = await verifySession()

    if (!session) {
      return null
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, created_at, updated_at")
      .eq("id", session.userId)
      .maybeSingle()

    if (error) {
      throw new Error("Unable to load the authenticated profile.")
    }

    return data
  }
)
