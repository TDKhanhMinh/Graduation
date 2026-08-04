"use client"

import { useCallback, useState } from "react"

import type { ReactionCount } from "./dal"

export type ReactionState = {
  counts: Record<string, ReactionCount>
  inflight: Set<string>
  error: string | null
}

export function useOptimisticReactions(initialCounts: ReactionCount[], wishId: string) {
  const [state, setState] = useState<ReactionState>(() => {
    const counts: Record<string, ReactionCount> = {}
    initialCounts.forEach((count) => {
      counts[count.emoji] = count
    })
    return { counts, inflight: new Set<string>(), error: null }
  })

  const reconcile = useCallback((serverCounts: ReactionCount[]) => {
    setState((previous) => {
      const counts = { ...previous.counts }

      serverCounts.forEach((count) => {
        if (!previous.inflight.has(count.emoji)) {
          counts[count.emoji] = count
        }
      })

      return { counts, inflight: previous.inflight, error: previous.error }
    })
  }, [])

  const toggle = useCallback(async (emoji: string) => {
    setState((previous) => {
      if (previous.inflight.has(emoji)) return previous

      const inflight = new Set(previous.inflight)
      inflight.add(emoji)
      const current = previous.counts[emoji] ?? { emoji, count: 0, hasReacted: false }
      const counts = { ...previous.counts }

      counts[emoji] = {
        emoji,
        count: current.hasReacted ? Math.max(0, current.count - 1) : current.count + 1,
        hasReacted: !current.hasReacted,
      }

      return { counts, inflight, error: null }
    })

    try {
      const response = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wishId, emoji }),
      })

      if (!response.ok) throw new Error("Failed to toggle reaction")

      const data = await response.json()

      setState((previous) => {
        const inflight = new Set(previous.inflight)
        inflight.delete(emoji)
        const counts = { ...previous.counts }
        const current = counts[emoji]

        if (current) counts[emoji] = { ...current, hasReacted: data.added }

        return { counts, inflight, error: null }
      })
    } catch (error) {
      console.error(error)

      setState((previous) => {
        const inflight = new Set(previous.inflight)
        inflight.delete(emoji)
        const current = previous.counts[emoji]
        const counts = { ...previous.counts }

        if (current) {
          counts[emoji] = {
            emoji,
            count: current.hasReacted ? Math.max(0, current.count - 1) : current.count + 1,
            hasReacted: !current.hasReacted,
          }
        }

        return {
          counts,
          inflight,
          error: "Không thể cập nhật phản ứng. Vui lòng thử lại.",
        }
      })
    }
  }, [wishId])

  return {
    reactions: Object.values(state.counts).filter(
      (count) => count.count > 0 || state.inflight.has(count.emoji),
    ),
    toggle,
    reconcile,
    inflight: state.inflight,
    error: state.error,
  }
}