"use client"

import { useGuidedTour } from "./useGuidedTour"
import { TourRunner } from "./TourRunner"
import { dashboardTourConfig } from "./config-dashboard"
import { X, Map } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"
import { InvitationStickerScene, type InvitationStickerSceneHandle } from "@/components/invitation/stickers/InvitationStickerScene"
import { useReducedMotion } from "framer-motion"
import { Button } from "@/components/ui/button"

function DashboardTourPrompt({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  return (
    <div id="dashboard-tour-prompt" className="fixed bottom-6 right-6 z-50 flex w-[calc(100vw-3rem)] max-w-[320px] flex-col gap-3 rounded-2xl bg-background p-5 text-foreground shadow-2xl ring-1 ring-border animate-in slide-in-from-bottom-5 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-start justify-between">
        <h4 className="font-heading font-semibold flex items-center gap-2">
          <Map className="w-5 h-5 text-primary" />
          Hướng dẫn nhanh
        </h4>
        <button onClick={onSkip} aria-label="Đóng" className="text-muted-foreground p-1 hover:bg-muted rounded-full">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Bạn có muốn xem qua hướng dẫn nhanh cách tạo sự kiện mới không?
      </p>
      <div className="flex justify-end gap-2 mt-2">
        <button onClick={onSkip} className="text-sm px-4 py-2 font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors">
          Để sau
        </button>
        <button onClick={onStart} className="text-sm px-4 py-2 font-medium bg-primary text-primary-foreground rounded-lg transition-colors hover:opacity-90">
          Bắt đầu
        </button>
      </div>
    </div>
  )
}

function DashboardTourPromptStickerBridge({ sceneRef, mascotId }: { sceneRef: React.RefObject<InvitationStickerSceneHandle | null>, mascotId: string }) {
  useEffect(() => {
    const initTimer = setTimeout(() => {
      if (sceneRef.current) {
        sceneRef.current.teleportToElement(mascotId, "#dashboard-tour-prompt", "top-left")
      }
    }, 50)
    
    const actionTimer = setTimeout(() => {
      if (sceneRef.current) {
        sceneRef.current.triggerAction(mascotId, "wave")
        sceneRef.current.triggerSpeech(mascotId, "Để mình hướng dẫn bạn cách tạo sự kiện nha!", 8)
      }
    }, 500)
    
    return () => {
      clearTimeout(initTimer)
      clearTimeout(actionTimer)
    }
  }, [sceneRef, mascotId])

  useEffect(() => {
    const refCurrent = sceneRef.current
    return () => {
      if (refCurrent) refCurrent.reset()
    }
  }, [sceneRef])

  return null
}

export function DashboardTourTrigger() {
  return (
    <Button 
      variant="outline" 
      onClick={() => window.dispatchEvent(new Event("guided-tour:start"))}
      className="gap-2"
    >
      <Map className="w-4 h-4" />
      Hướng dẫn
    </Button>
  )
}

export function DashboardTourExperience() {
  const reducedMotion = useReducedMotion() ?? false
  const [mounted, setMounted] = useState(false)
  const [targetReady, setTargetReady] = useState(false)
  const sceneRef = useRef<InvitationStickerSceneHandle>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    
    // Check if the first target exists before showing the prompt
    // We check for event-title which is our first target in config
    const target = document.querySelector("[data-tour-target='event-title']")
    if (target) {
      setTargetReady(true)
    } else {
      // In case it renders slightly after due to transitions/animations, wait a bit
      const timer = setTimeout(() => {
        if (document.querySelector("[data-tour-target='event-title']")) {
          setTargetReady(true)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])
  
  const tour = useGuidedTour({
    tourId: dashboardTourConfig.tourId,
    version: dashboardTourConfig.version,
    ready: targetReady,
    autoPrompt: true
  })

  // We mount the portal only if the tour is ready to prompt or running
  const shouldRenderStickers = mounted && (tour.stage === "ready" || tour.stage === "running")

  return (
    <>
      {shouldRenderStickers && createPortal(
        <InvitationStickerScene 
          ref={sceneRef} 
          activeStickerIds={dashboardTourConfig.mascotId ? [dashboardTourConfig.mascotId] : undefined}
          className="pointer-events-none fixed inset-0 z-[110] overflow-hidden" 
          performanceOptions={{ lowPowerMode: reducedMotion, enableShadows: !reducedMotion }}
        />,
        document.body
      )}
      
      {tour.stage === "ready" && (
        <>
          <DashboardTourPrompt onStart={tour.startTour} onSkip={tour.skipTour} />
          {dashboardTourConfig.mascotId && (
            <DashboardTourPromptStickerBridge sceneRef={sceneRef} mascotId={dashboardTourConfig.mascotId} />
          )}
        </>
      )}
      
      {tour.stage === "running" && (
        <TourRunner 
          config={dashboardTourConfig} 
          onComplete={tour.completeTour} 
          onSkip={tour.skipTour}
          reducedMotion={reducedMotion}
          sceneRef={sceneRef}
        />
      )}
    </>
  )
}
