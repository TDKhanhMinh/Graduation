"use client"

import { useGuidedTour } from "./useGuidedTour"
import { TourRunner } from "./TourRunner"
import { defaultTourConfig } from "./config"
import { useWelcomeExperience } from "@/components/event-welcome/WelcomeExperience"
import { resolveWelcomeDeepLink } from "@/features/events/welcome"
import { X, Map } from "lucide-react"
import { useEffect, useState, useRef, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { InvitationStickerScene, type InvitationStickerSceneHandle } from "@/components/invitation/stickers/InvitationStickerScene"

export type TourExperienceProps = {
  slug: string
  deepLinkSkipIntro?: boolean
  eventStatus?: "archived" | "upcoming" | "live" | "closed"
  children?: ReactNode
}

function TourPrompt({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex w-[calc(100vw-3rem)] max-w-[320px] flex-col gap-3 rounded-2xl bg-[var(--event-surface)] p-5 text-[var(--event-text)] shadow-2xl ring-1 ring-[var(--event-border)] animate-in slide-in-from-bottom-5 backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--event-surface)]">
      <div className="flex items-start justify-between">
        <h4 className="font-heading font-semibold flex items-center gap-2">
          <Map className="w-5 h-5 text-[var(--event-primary)]" />
          Hướng dẫn tham gia
        </h4>
        <button onClick={onSkip} aria-label="Đóng" className="text-muted-foreground p-1 hover:bg-black/5 rounded-full">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Bạn có muốn xem qua hướng dẫn ngắn để hiểu rõ hơn về thiệp mời này không?
      </p>
      <div className="flex justify-end gap-2 mt-2">
        <button onClick={onSkip} className="text-sm px-4 py-2 font-medium text-muted-foreground hover:bg-black/5 rounded-lg transition-colors">
          Để sau
        </button>
        <button onClick={onStart} className="text-sm px-4 py-2 font-medium bg-[var(--event-primary)] text-[var(--event-on-primary)] rounded-lg transition-colors hover:opacity-90">
          Bắt đầu
        </button>
      </div>
    </div>
  )
}

function TourPromptStickerBridge({ sceneRef, mascotId }: { sceneRef: React.RefObject<InvitationStickerSceneHandle | null>, mascotId: string }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sceneRef.current) {
        sceneRef.current.triggerAction(mascotId, "wave")
        sceneRef.current.triggerSpeech(mascotId, "Bạn có muốn mình hướng dẫn nhanh cách dùng thiệp không?", 8)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [sceneRef, mascotId])

  useEffect(() => {
    const refCurrent = sceneRef.current
    return () => {
      if (refCurrent) refCurrent.reset()
    }
  }, [sceneRef])

  return null
}

export function TourExperience({ 
  slug, 
  eventStatus = "upcoming", 
  children 
}: TourExperienceProps) {
  const { stage: splashStage, reducedMotion } = useWelcomeExperience()
  const [deepLinkSkip, setDeepLinkSkip] = useState(false)
  const [mounted, setMounted] = useState(false)
  const sceneRef = useRef<InvitationStickerSceneHandle>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    const deepLink = resolveWelcomeDeepLink({
      search: window.location.search,
      hash: window.location.hash
    })
    setDeepLinkSkip(deepLink.skipIntro)
  }, [])
  
  const tour = useGuidedTour({
    tourId: `invitation-tour:${slug}`,
    version: defaultTourConfig.version,
    ready: splashStage === "closed" && !deepLinkSkip && eventStatus !== "archived" && eventStatus !== "closed",
    autoPrompt: true
  })

  return (
    <>
      {children}
      {mounted && (tour.stage === "ready" || tour.stage === "running") && createPortal(
        <InvitationStickerScene 
          ref={sceneRef} 
          className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" 
          performanceOptions={{ lowPowerMode: reducedMotion, enableShadows: !reducedMotion }}
        />,
        document.body
      )}
      {tour.stage === "ready" && (
        <>
          <TourPrompt onStart={tour.startTour} onSkip={tour.skipTour} />
          <TourPromptStickerBridge sceneRef={sceneRef} mascotId="anime-party" />
        </>
      )}
      {tour.stage === "running" && (
        <TourRunner 
          config={defaultTourConfig} 
          onComplete={tour.completeTour} 
          onSkip={tour.skipTour}
          reducedMotion={reducedMotion}
          sceneRef={sceneRef}
        />
      )}
    </>
  )
}
