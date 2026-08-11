"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { GuidedTourStep } from "./types"

type TourCardProps = {
  step: GuidedTourStep
  stepIndex: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  onComplete: () => void
  position: { x: number; y: number } | null
  reducedMotion?: boolean
}

export function TourCard({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  onComplete,
  position,
  reducedMotion = false
}: TourCardProps) {
  const isLast = stepIndex === totalSteps - 1
  const isFirst = stepIndex === 0
  
  // Focus management
  const nextBtnRef = useRef<HTMLButtonElement>(null)
  
  useEffect(() => {
    // Focus the primary action when step changes
    if (!reducedMotion) {
      const timer = setTimeout(() => {
        nextBtnRef.current?.focus({ preventScroll: true })
      }, 100) // allow repositioning
      return () => clearTimeout(timer)
    } else {
      nextBtnRef.current?.focus({ preventScroll: true })
    }
  }, [stepIndex, reducedMotion])

  // Esc to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onSkip()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onSkip])

  return (
    <motion.div
      data-guided-tour-card=""
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-step-title"
      aria-describedby="tour-step-content"
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.95 }}
      animate={
        position
          ? { 
              opacity: 1, 
              scale: 1, 
              x: position.x, 
              y: position.y 
            }
          : { opacity: 0 }
      }
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute z-[120] flex w-[90vw] max-w-[320px] flex-col gap-4 rounded-2xl bg-[var(--event-surface)] p-5 text-[var(--event-text)] shadow-2xl ring-1 ring-[var(--event-border)] backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--event-surface)]"
      style={{
        backgroundColor: "var(--event-surface, #fff)",
        color: "var(--event-text, #111)",
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {stepIndex + 1} / {totalSteps}
        </p>
        <button
          type="button"
          onClick={onSkip}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Đóng hướng dẫn"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-2">
        <h3 id="tour-step-title" className="font-heading text-lg font-semibold">
          {step.title}
        </h3>
        <p id="tour-step-content" aria-live="polite" aria-atomic="true" className="text-sm leading-relaxed text-muted-foreground">
          {step.content}
        </p>
        {step.speech && (
          <div className="mt-3 rounded-xl bg-primary/10 p-3 text-sm italic text-primary">
            &quot;{step.speech}&quot;
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrev}
          disabled={isFirst}
          className={isFirst ? "invisible min-h-11 min-w-11" : "min-h-11 min-w-11"}
        >
          Trở lại
        </Button>

        <Button
          ref={nextBtnRef}
          variant="default"
          size="sm"
          onClick={isLast ? onComplete : onNext}
          className="min-h-11 min-w-11"
        >
          {isLast ? "Hoàn tất" : "Tiếp theo"}
        </Button>
      </div>
    </motion.div>
  )
}
