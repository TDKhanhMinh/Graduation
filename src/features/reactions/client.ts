"use client"
import { useState, useCallback } from "react"
import type { ReactionCount } from "./dal"

export type ReactionState = {
  counts: Record<string, ReactionCount>
  inflight: Set<string>
}

export function useOptimisticReactions(initialCounts: ReactionCount[], wishId: string) {
  const [state, setState] = useState<ReactionState>(() => {
    const counts: Record<string, ReactionCount> = {}
    initialCounts.forEach(c => counts[c.emoji] = c)
    return { counts, inflight: new Set() }
  })
  
  const reconcile = useCallback((serverCounts: ReactionCount[]) => {
    setState(prev => {
      const newCounts = { ...prev.counts }
      serverCounts.forEach(c => {
        if (!prev.inflight.has(c.emoji)) {
          newCounts[c.emoji] = c
        }
      })
      return { counts: newCounts, inflight: prev.inflight }
    })
  }, [])
  
  const toggle = useCallback(async (emoji: string) => {
    setState(prev => {
      if (prev.inflight.has(emoji)) return prev
      
      const newInflight = new Set(prev.inflight)
      newInflight.add(emoji)
      
      const current = prev.counts[emoji] || { emoji, count: 0, hasReacted: false }
      const newCounts = { ...prev.counts }
      
      newCounts[emoji] = {
        emoji,
        count: current.hasReacted ? Math.max(0, current.count - 1) : current.count + 1,
        hasReacted: !current.hasReacted
      }
      
      return { counts: newCounts, inflight: newInflight }
    })
    
    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wishId, emoji })
      })
      
      if (!res.ok) {
        throw new Error("Failed to toggle reaction")
      }
      
      const data = await res.json()
      
      setState(prev => {
        const newInflight = new Set(prev.inflight)
        newInflight.delete(emoji)
        
        const newCounts = { ...prev.counts }
        const current = newCounts[emoji]
        
        if (current) {
           newCounts[emoji] = {
              ...current,
              hasReacted: data.added
           }
        }
        
        return { counts: newCounts, inflight: newInflight }
      })
      
    } catch (err) {
      console.error(err)
      setState(prev => {
        const newInflight = new Set(prev.inflight)
        newInflight.delete(emoji)
        
        const current = prev.counts[emoji]
        const newCounts = { ...prev.counts }
        
        if (current) {
          // Revert back
          newCounts[emoji] = {
            emoji,
            count: current.hasReacted ? Math.max(0, current.count - 1) : current.count + 1,
            hasReacted: !current.hasReacted
          }
        }
        
        return { counts: newCounts, inflight: newInflight }
      })
    }
  }, [wishId])
  
  return {
    reactions: Object.values(state.counts).filter(c => c.count > 0 || state.inflight.has(c.emoji)),
    toggle,
    reconcile,
    inflight: state.inflight
  }
}
