"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"

import {
  getWelcomeSplashSessionKey,
  resolveWelcomeDeepLink,
  type AudioStatus,
  type WelcomeStage,
} from "@/features/events/welcome"

export type WelcomeExperienceContextValue = {
  stage: WelcomeStage
  audioStatus: AudioStatus
  confettiTriggerCount: number
  reducedMotion: boolean
  openEnvelope: () => void
  completeOpening: () => void
  closeModal: () => void
  reopenModal: (triggerEl?: HTMLElement | null) => void
  sendWish: () => void
  exploreEvent: () => void
  setAudioStatus: (status: AudioStatus) => void
  confettiActive: boolean
  completeConfetti: () => void
}

const WelcomeExperienceContext = createContext<WelcomeExperienceContextValue | null>(null)

export function useWelcomeExperience(): WelcomeExperienceContextValue {
  const ctx = useContext(WelcomeExperienceContext)
  if (!ctx) {
    throw new Error("useWelcomeExperience must be used within a WelcomeExperience provider")
  }
  return ctx
}

type WelcomeExperienceProps = {
  slug: string
  children: ReactNode
}

function focusElement(id: string, smooth: boolean) {
  const target = document.getElementById(id)
  if (!target) return
  target.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" })
  const focusable = target.querySelector<HTMLElement>(
    '[data-testid="open-composer"], button, a, input, textarea, select, [tabindex]:not([tabindex="-1"])',
  )
  focusable?.focus({ preventScroll: true })
}

function subscribeToMotionPreference(callback: () => void) {
  if (typeof window === "undefined") return () => undefined

  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
  mediaQuery.addEventListener("change", callback)
  return () => mediaQuery.removeEventListener("change", callback)
}

function getMotionPreference() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function getServerMotionPreference() {
  return false
}

export function WelcomeExperience({ slug, children }: WelcomeExperienceProps) {
  const [stage, setStage] = useState<WelcomeStage>("checking")
  const [audioStatus, setAudioStatusState] = useState<AudioStatus>("idle")
  const [confettiTriggerCount, setConfettiTriggerCount] = useState<number>(0)
  const [confettiCompletedCount, setConfettiCompletedCount] = useState<number>(0)
  const reducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    getMotionPreference,
    getServerMotionPreference,
  )

  const triggerRef = useRef<HTMLElement | null>(null)
  const transitionLockRef = useRef<boolean>(false)
  const originalOverflowRef = useRef<string | null>(null)

  // 1. Storage & Session Check on Mount
  useEffect(() => {
    let initialStage: WelcomeStage = "closed"

    const deepLink = resolveWelcomeDeepLink({
      search: window.location.search,
      hash: window.location.hash,
    })

    try {
      const key = getWelcomeSplashSessionKey(slug)
      const hasVisited = window.sessionStorage.getItem(key)
      if (!hasVisited && !deepLink.skipIntro) {
        initialStage = "intro"
      }
    } catch {
      // Storage unavailable fallback
      initialStage = deepLink.skipIntro ? "closed" : "intro"
    }

    // Browser storage is intentionally read after mount to preserve the server/client render contract.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStage(initialStage)
  }, [slug])

  // 2. Body Scroll Lock Management
  useEffect(() => {
    const isModalOpen = stage === "intro" || stage === "opening" || stage === "open"
    if (isModalOpen) {
      if (originalOverflowRef.current === null) {
        originalOverflowRef.current = document.body.style.overflow
      }
      document.body.style.overflow = "hidden"
    } else {
      if (originalOverflowRef.current !== null) {
        document.body.style.overflow = originalOverflowRef.current
        originalOverflowRef.current = null
      }
    }

    return () => {
      if (originalOverflowRef.current !== null) {
        document.body.style.overflow = originalOverflowRef.current
        originalOverflowRef.current = null
      }
    }
  }, [stage])

  // 3. Actions & Guarded State Machine Transitions
  const openEnvelope = useCallback(() => {
    if (transitionLockRef.current) return
    if (stage === "open" || stage === "opening") return

    transitionLockRef.current = true

    // Write session key upon deliberate envelope open action
    try {
      const key = getWelcomeSplashSessionKey(slug)
      window.sessionStorage.setItem(key, "1")
    } catch {
      // Ignore storage errors
    }

    setConfettiTriggerCount((prev) => prev + 1)
    setStage("opening")

    // Release double-click lock after microtask
    setTimeout(() => {
      transitionLockRef.current = false
    }, 300)
  }, [slug, stage])

  const completeOpening = useCallback(() => {
    setStage("open")
  }, [])

  const closeModal = useCallback(() => {
    if (transitionLockRef.current) return
    transitionLockRef.current = true

    setStage("closing")

    setTimeout(() => {
      setStage("closed")
      transitionLockRef.current = false

      // Restore focus to saved trigger element if present
      if (triggerRef.current) {
        triggerRef.current.focus({ preventScroll: true })
        triggerRef.current = null
      }
    }, reducedMotion ? 0 : 250)
  }, [reducedMotion])

  const reopenModal = useCallback((triggerEl?: HTMLElement | null) => {
    if (transitionLockRef.current) return
    if (triggerEl) triggerRef.current = triggerEl

    transitionLockRef.current = true
    setConfettiTriggerCount((prev) => prev + 1)
    setStage("opening")

    setTimeout(() => {
      transitionLockRef.current = false
    }, 300)
  }, [])

  const sendWish = useCallback(() => {
    closeModal()
    setTimeout(() => {
      focusElement("submit-wish", !reducedMotion)
    }, reducedMotion ? 10 : 260)
  }, [closeModal, reducedMotion])

  const exploreEvent = useCallback(() => {
    closeModal()
    setTimeout(() => {
      focusElement("wall-heading", !reducedMotion)
    }, reducedMotion ? 10 : 260)
  }, [closeModal, reducedMotion])

  const setAudioStatus = useCallback((status: AudioStatus) => {
    setAudioStatusState(status)
  }, [])

  const completeConfetti = useCallback(() => {
    setConfettiCompletedCount((previous) => Math.max(previous, confettiTriggerCount))
  }, [confettiTriggerCount])

  const contextValue: WelcomeExperienceContextValue = {
    stage,
    audioStatus,
    confettiTriggerCount,
    confettiActive: confettiTriggerCount > confettiCompletedCount,
    reducedMotion,
    openEnvelope,
    completeOpening,
    closeModal,
    reopenModal,
    sendWish,
    exploreEvent,
    setAudioStatus,
    completeConfetti,
  }

  return (
    <WelcomeExperienceContext.Provider value={contextValue}>
      <div
        className="welcome-experience-container contents"
        data-welcome-stage={stage}
        data-welcome-audio={audioStatus}
        data-welcome-motion={reducedMotion ? "reduced" : "normal"}
      >
        {children}
      </div>
    </WelcomeExperienceContext.Provider>
  )
}
