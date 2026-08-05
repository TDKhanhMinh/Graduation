import { useCallback, useEffect, useRef, useState } from "react"

export type TimelineContentType = "text" | "image" | "video"
export type TimelinePhaseName = "entry" | "reveal" | "reaction" | "exit"

export type TimelinePhase = {
  name: TimelinePhaseName
  start: number
  duration: number
}

export type TimelinePlan = {
  contentType: TimelineContentType
  totalDuration: number
  phases: TimelinePhase[]
}

const DURATIONS: Record<TimelineContentType, Record<TimelinePhaseName, number>> = {
  text: { entry: 500, reveal: 3500, reaction: 1000, exit: 2000 },
  image: { entry: 700, reveal: 4200, reaction: 1100, exit: 2000 },
  video: { entry: 900, reveal: 7000, reaction: 1200, exit: 2900 },
}

export function createTimelinePlan({
  contentType,
  reducedMotion = false,
}: {
  contentType: TimelineContentType
  reducedMotion?: boolean
}): TimelinePlan {
  const durations = reducedMotion
    ? { entry: 0, reveal: 0, reaction: 0, exit: 0 }
    : DURATIONS[contentType]
  let start = 0
  const phases = (Object.keys(durations) as TimelinePhaseName[]).map((name) => {
    const phase = { name, start, duration: durations[name] }
    start += phase.duration
    return phase
  })

  return { contentType, totalDuration: start, phases }
}

export function getTimelinePhase(plan: TimelinePlan, elapsed: number): TimelinePhaseName {
  if (plan.phases.length === 0) return "exit"
  const phase = plan.phases.find((item) => elapsed < item.start + item.duration)
  return phase?.name ?? "exit"
}

export function useTimelinePlayback(reducedMotion = false, onComplete?: () => void) {
  const [plan, setPlan] = useState<TimelinePlan | null>(null)
  const [phase, setPhase] = useState<TimelinePhaseName>("entry")
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<number | null>(null)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  const play = useCallback((nextPlan: TimelinePlan) => {
    clearTimer()
    setPlan(nextPlan)
    setPhase(nextPlan.totalDuration === 0 ? "exit" : "entry")
    setIsPaused(false)
    if (nextPlan.totalDuration > 0) {
      timerRef.current = window.setTimeout(() => {
        setPhase("exit")
        onCompleteRef.current?.()
      }, nextPlan.totalDuration)
    } else {
      onCompleteRef.current?.()
    }
  }, [clearTimer])

  const pause = useCallback(() => {
    clearTimer()
    setIsPaused(true)
  }, [clearTimer])

  const resume = useCallback(() => {
    if (!plan || plan.totalDuration === 0) return
    setIsPaused(false)
    timerRef.current = window.setTimeout(() => {
      setPhase("exit")
      onCompleteRef.current?.()
    }, plan.totalDuration)
  }, [plan])

  useEffect(() => clearTimer, [clearTimer, reducedMotion])

  return { plan, phase, isPaused, play, pause, resume }
}
