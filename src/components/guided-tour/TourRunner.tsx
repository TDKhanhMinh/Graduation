"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { createPortal } from "react-dom"

import { TourCard } from "./TourCard"
import type { GuidedTourConfig } from "./types"
import { type InvitationStickerSceneHandle } from "@/components/invitation/stickers/InvitationStickerScene"
import { TourStickerBridge } from "./TourStickerBridge"

type TourRunnerProps = {
  config: GuidedTourConfig
  onComplete: () => void
  onSkip: () => void
  reducedMotion?: boolean
  sceneRef: React.RefObject<InvitationStickerSceneHandle | null>
}

type Rect = { top: number; left: number; width: number; height: number; bottom: number; right: number }

function waitForTourTarget(selector: string, timeoutMs: number = 3000): Promise<Element | null> {
  return new Promise((resolve) => {
    const el = document.querySelector(selector)
    if (el) return resolve(el)
    
    const timer = setTimeout(() => {
      observer.disconnect()
      resolve(document.querySelector(selector))
    }, timeoutMs)
    
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector)
      if (el) {
        observer.disconnect()
        clearTimeout(timer)
        resolve(el)
      }
    })
    
    observer.observe(document.body, { childList: true, subtree: true })
  })
}

export function TourRunner({ config, onComplete, onSkip, reducedMotion = false, sceneRef }: TourRunnerProps) {
  const [mounted, setMounted] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<Rect | null>(null)
  
  const step = config.steps[stepIndex]
  const prevFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    if (document.activeElement instanceof HTMLElement) {
      prevFocusRef.current = document.activeElement
    }
    return () => {
      if (prevFocusRef.current) {
        prevFocusRef.current.focus({ preventScroll: true })
      }
    }
  }, [])

  // measure target logic split into async wait and sync update
  useEffect(() => {
    let active = true
    let measureTimer: NodeJS.Timeout

    const resolveTarget = async () => {
      if (!step?.targetSelector) {
        if (active) setTargetRect(null)
        return
      }
      
      const el = await waitForTourTarget(step.targetSelector)
      if (!active) return
      
      if (!el) {
        console.warn(`Tour target ${step.targetSelector} not found.`)
        // Missing target fallback -> auto-skip step
        if (stepIndex < config.steps.length - 1) {
          setStepIndex(stepIndex + 1)
        } else {
          onComplete()
        }
        return
      }
      
      // Auto-scroll
      el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center", inline: "nearest" })
      
      const measure = () => {
        if (!active) return
        const rect = el.getBoundingClientRect()
        const newRect = {
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom + window.scrollY,
          right: rect.right + window.scrollX,
        }
        setTargetRect(prev => {
          if (prev && 
              Math.abs(prev.top - newRect.top) < 1 &&
              Math.abs(prev.left - newRect.left) < 1 &&
              Math.abs(prev.width - newRect.width) < 1 &&
              Math.abs(prev.height - newRect.height) < 1) {
            return prev
          }
          return newRect
        })
      }
      
      measureTimer = setTimeout(measure, reducedMotion ? 50 : 350)
    }
    
    resolveTarget()
    
    return () => {
      active = false
      if (measureTimer) clearTimeout(measureTimer)
    }
  }, [step, stepIndex, config.steps.length, onComplete, reducedMotion])

  const measureTargetSync = useCallback(() => {
    if (!step?.targetSelector) return
    const el = document.querySelector(step.targetSelector)
    if (!el) return
    
    const rect = el.getBoundingClientRect()
    const newRect = {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom + window.scrollY,
      right: rect.right + window.scrollX,
    }
    setTargetRect(prev => {
      if (prev && 
          Math.abs(prev.top - newRect.top) < 1 &&
          Math.abs(prev.left - newRect.left) < 1 &&
          Math.abs(prev.width - newRect.width) < 1 &&
          Math.abs(prev.height - newRect.height) < 1) {
        return prev
      }
      return newRect
    })
  }, [step])

  useEffect(() => {
    const handleScrollResize = () => measureTargetSync()
    // Passive to avoid scroll jank
    window.addEventListener("scroll", handleScrollResize, { passive: true })
    window.addEventListener("resize", handleScrollResize, { passive: true })
    window.addEventListener("orientationchange", handleScrollResize, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScrollResize)
      window.removeEventListener("resize", handleScrollResize)
      window.removeEventListener("orientationchange", handleScrollResize)
    }
  }, [measureTargetSync])

  const handleNext = useCallback(() => {
    if (stepIndex < config.steps.length - 1) {
      setStepIndex(stepIndex + 1)
    } else {
      onComplete()
    }
  }, [stepIndex, config.steps.length, onComplete])

  const handlePrev = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1)
    }
  }, [stepIndex])

  if (!mounted || !step) return null

  // Calculate placement based on targetRect
  let cardPos = null
  if (targetRect) {
    const cardWidth = 320 // matches max-w-[320px]
    const cardHeight = 240 // rough estimation of card height
    const padding = 20
    const pad = 12 // hole padding
    const placement = step.placement || "auto"
    
    let y = targetRect.bottom + pad + padding
    let x = targetRect.left + (targetRect.width / 2) - (cardWidth / 2)
    
    // Calculate position based on placement
    if (placement === "top") {
      y = targetRect.top - pad - padding - cardHeight
    } else if (placement === "bottom") {
      y = targetRect.bottom + pad + padding
    } else if (placement === "left") {
      x = targetRect.left - pad - padding - cardWidth
      y = targetRect.top + (targetRect.height / 2) - (cardHeight / 2)
    } else if (placement === "right") {
      x = targetRect.right + pad + padding
      y = targetRect.top + (targetRect.height / 2) - (cardHeight / 2)
    }
    
    // clamp horizontally
    if (x < padding) x = padding
    if (x + cardWidth > document.documentElement.clientWidth - padding) {
      x = document.documentElement.clientWidth - cardWidth - padding
    }

    // clamp vertically
    const viewportTop = window.scrollY + padding
    const viewportBottom = window.scrollY + window.innerHeight - padding
    
    if (y < viewportTop) {
      // Too high, push below target
      y = targetRect.bottom + pad + padding
    } else if (y + cardHeight > viewportBottom) {
      // Too low, push above target
      y = targetRect.top - pad - padding - cardHeight
    }

    cardPos = { x, y }
  } else {
    // center in viewport
    cardPos = {
      x: (window.innerWidth / 2) - 160,
      y: window.scrollY + (window.innerHeight / 2) - 120,
    }
  }

  return createPortal(
    <div className="tour-root" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      
      {/* Dim overlay */}
      {!targetRect && (
        <div className="fixed inset-0 bg-black/50 z-40" />
      )}

      {/* Spotlight hole */}
      {targetRect && (
        <motion.div
          className="pointer-events-none absolute z-40 rounded-2xl"
          initial={false}
          animate={{
            top: targetRect.top - 12,
            left: targetRect.left - 12,
            width: targetRect.width + 24,
            height: targetRect.height + 24,
          }}
          transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 30 }}
          style={{
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.65)",
          }}
        />
      )}

      {/* Card */}
      <div className="pointer-events-auto">
        <TourCard
          step={step}
          stepIndex={stepIndex}
          totalSteps={config.steps.length}
          onNext={handleNext}
          onPrev={handlePrev}
          onSkip={onSkip}
          onComplete={onComplete}
          position={cardPos}
          reducedMotion={reducedMotion}
        />
      </div>

      <TourStickerBridge step={step} sceneRef={sceneRef} />
      
    </div>,
    document.body
  )
}
