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

  const measureTarget = useCallback(() => {
    if (!step?.targetSelector) {
      setTargetRect(null)
      return
    }
    const el = document.querySelector(step.targetSelector)
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
    
    // Avoid re-triggering state unnecessarily
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
  }, [step, stepIndex, config.steps.length, onComplete])

  useEffect(() => {
    if (step?.targetSelector) {
      const el = document.querySelector(step.targetSelector)
      if (el) {
        el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center", inline: "nearest" })
      }
    }
    
    // Wait for scroll to settle
    const timeoutId = setTimeout(measureTarget, reducedMotion ? 50 : 350)
    return () => clearTimeout(timeoutId)
  }, [stepIndex, measureTarget, reducedMotion, step?.targetSelector])

  useEffect(() => {
    const handleScrollResize = () => measureTarget()
    // Passive to avoid scroll jank
    window.addEventListener("scroll", handleScrollResize, { passive: true })
    window.addEventListener("resize", handleScrollResize, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScrollResize)
      window.removeEventListener("resize", handleScrollResize)
    }
  }, [measureTarget])

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
    
    let y = targetRect.bottom + pad + padding
    let x = targetRect.left + (targetRect.width / 2) - (cardWidth / 2)
    
    // clamp horizontally
    if (x < padding) x = padding
    if (x + cardWidth > document.documentElement.clientWidth - padding) {
      x = document.documentElement.clientWidth - cardWidth - padding
    }

    // clamp vertically: if it goes past the viewport bottom, place it ABOVE the target instead
    const viewportBottom = window.scrollY + window.innerHeight
    if (y + cardHeight > viewportBottom) {
      const spaceAbove = targetRect.top - window.scrollY
      // If there's more space above than below, or if below is strictly out of bounds
      if (spaceAbove > cardHeight + padding + pad) {
        y = targetRect.top - pad - padding - cardHeight
      }
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
    <div className="tour-root" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 100, pointerEvents: "none" }}>
      
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
