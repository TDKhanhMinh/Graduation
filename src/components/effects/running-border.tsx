"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useInView } from "framer-motion"

export interface GlowingRunningBorderProps {
  children?: React.ReactNode
  className?: string
  innerClassName?: string
  borderRadius?: string
  glowTheme?: "primary" | "pink" | "gold" | "cyan"
  duration?: number
  borderWidth?: string
  variant?: "strong" | "subtle" | "static"
}

export function GlowingRunningBorder({
  children,
  className = "",
  innerClassName = "",
  borderRadius = "rounded-3xl",
  glowTheme = "primary",
  duration = 6,
  borderWidth = "p-[1.5px]",
  variant = "strong",
}: GlowingRunningBorderProps) {
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false
  )

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onChange = () => setReducedMotion(media.matches)
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])

  const themeConicGradients = {
    primary: "conic-gradient(from 0deg, transparent 0 270deg, var(--primary) 320deg, #ec4899 350deg, #3b82f6 360deg)",
    pink: "conic-gradient(from 0deg, transparent 0 270deg, #f43f5e 320deg, #e11d48 350deg, #a855f7 360deg)",
    gold: "conic-gradient(from 0deg, transparent 0 270deg, #f59e0b 320deg, #fbbf24 350deg, #d97706 360deg)",
    cyan: "conic-gradient(from 0deg, transparent 0 270deg, #06b6d4 320deg, #3b82f6 350deg, #6366f1 360deg)",
  }
  
  const themeStaticGradients = {
    primary: "linear-gradient(to right, var(--primary), #ec4899)",
    pink: "linear-gradient(to right, #f43f5e, #a855f7)",
    gold: "linear-gradient(to right, #f59e0b, #d97706)",
    cyan: "linear-gradient(to right, #06b6d4, #6366f1)",
  }

  const selectedConic = themeConicGradients[glowTheme] || themeConicGradients.primary
  const selectedStatic = themeStaticGradients[glowTheme] || themeStaticGradients.primary

  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref)
  const isStatic = variant === "static" || reducedMotion || !isInView

  return (
    <div ref={ref} className={`relative ${borderWidth} overflow-hidden ${borderRadius} ${className}`}>
      {/* Ambient Outer Glow Layer */}
      {variant !== "static" && (
        <div
          className={`absolute -inset-1 blur-md ${borderRadius} bg-gradient-to-r from-primary via-purple-500 to-pink-500 ${variant === "subtle" ? "opacity-10" : "opacity-30"}`}
          aria-hidden="true"
        />
      )}

      {/* Running Conic Beam Layer or Static Layer */}
      {!isStatic ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration, repeat: Infinity, ease: "linear" }}
          className={`absolute -inset-[200%] aspect-square origin-center ${variant === "subtle" ? "opacity-50" : "opacity-100"}`}
          style={{ background: selectedConic }}
        />
      ) : (
        <div className="absolute inset-0 opacity-50" style={{ background: selectedStatic }} />
      )}

      {/* Inner Content Container */}
      <div className={`relative z-10 h-full w-full bg-card ${borderRadius} ${innerClassName}`}>
        {children}
      </div>
    </div>
  )
}
