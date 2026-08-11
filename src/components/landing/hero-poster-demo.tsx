"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useMotionValue, useTransform, useInView } from "framer-motion"
import { QrCode, Heart, MessageCircle, Image as ImageIcon, Video, ArrowRight } from "lucide-react"

import { GlowingRunningBorder } from "@/components/effects/running-border"
import { localPosterTemplates } from "@/features/posters/templates"

const demoTemplates = localPosterTemplates.slice(0, 3)

type HeroDemoState = "intro" | "idle" | "exploding" | "settled"

const floatingContributions = [
  { id: 1, type: "wish", text: "Chúc 2 bạn trăm năm hạnh phúc! 💕", name: "Minh Quân", icon: MessageCircle, accent: "text-pink-500", dest: { x: -150, y: -160, r: -5 } },
  { id: 2, type: "photo", label: "Ảnh check-in", icon: ImageIcon, accent: "text-cyan-500", dest: { x: 170, y: -120, r: 8 } },
  { id: 3, type: "reaction", label: "❤️ x 12", icon: Heart, accent: "text-rose-500", dest: { x: -160, y: 120, r: -12 } },
  { id: 4, type: "video", label: "Video chúc mừng.mp4", icon: Video, accent: "text-amber-500", dest: { x: 160, y: 140, r: 6 } },
]

export function HeroPosterDemo() {
  const [templateIndex, setTemplateIndex] = useState(0)
  const [demoState, setDemoState] = useState<HeroDemoState>("intro")
  const [hasInteracted, setHasInteracted] = useState(() => typeof window !== "undefined" ? !!sessionStorage.getItem("memoria.heroQrHint.v1") : false)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false)
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" ? window.matchMedia("(max-width: 1024px)").matches : false)

  const rootRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(rootRef, { amount: 0.2 })

  // Mouse Parallax hooks (Performance optimized, no re-renders)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const mobileQuery = window.matchMedia("(max-width: 1024px)") // Treat tablet as mobile for parallax
    
    const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    const handleMobileChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    
    motionQuery.addEventListener("change", handleMotionChange)
    mobileQuery.addEventListener("change", handleMobileChange)


    const t1 = setTimeout(() => setDemoState("idle"), 1600)

    const timer = setInterval(() => {
      setTemplateIndex((current) => (current + 1) % demoTemplates.length)
    }, 5000)

    // Mouse movement listener for Parallax
    const handleMouseMove = (e: MouseEvent) => {
      if (mobileQuery.matches || motionQuery.matches || !isInView) return
      mouseX.set((e.clientX / window.innerWidth - 0.5) * 2)
      mouseY.set((e.clientY / window.innerHeight - 0.5) * 2)
    }
    window.addEventListener("mousemove", handleMouseMove, { passive: true })

    return () => {
      clearTimeout(t1)
      clearInterval(timer)
      window.removeEventListener("mousemove", handleMouseMove)
      motionQuery.removeEventListener("change", handleMotionChange)
      mobileQuery.removeEventListener("change", handleMobileChange)
    }
  }, [isInView, mouseX, mouseY])

  // Parallax transform layers
  const xBg = useTransform(mouseX, [-1, 1], [-4, 4])
  const yBg = useTransform(mouseY, [-1, 1], [-4, 4])
  const xMid = useTransform(mouseX, [-1, 1], [-7, 7])
  const yMid = useTransform(mouseY, [-1, 1], [-7, 7])
  const xFg = useTransform(mouseX, [-1, 1], [-12, 12])
  const yFg = useTransform(mouseY, [-1, 1], [-12, 12])

  const triggerExplosion = () => {
    if (demoState === "exploding") return
    
    if (!hasInteracted) {
      setHasInteracted(true)
      sessionStorage.setItem("memoria.heroQrHint.v1", "true")
    }

    setDemoState("exploding")
    setTimeout(() => {
      setDemoState("settled")
    }, 1500)
  }

  const template = demoTemplates[templateIndex]
  const palette = template.palette

  return (
    <div ref={rootRef} className="relative mx-auto w-full max-w-xl" aria-label="Xem trước áp phích tương tác">
      
      {/* Background Layer: Ambient Motion (Parallax) */}
      {!isMobile && !reducedMotion && (
        <motion.div 
          style={{ x: xBg, y: yBg }} 
          className="absolute inset-0 pointer-events-none opacity-40 bg-gradient-to-tr from-primary/10 to-purple-500/10 blur-3xl rounded-full" 
        />
      )}

      {/* Midground Layer: Main Poster */}
      <motion.div
        style={!isMobile && !reducedMotion ? { x: xMid, y: yMid } : {}}
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        className="relative mx-auto aspect-[4/5] w-full max-w-sm"
      >
        <GlowingRunningBorder borderRadius="rounded-[2.5rem]" glowTheme="primary" duration={5} variant="subtle">
          <div className="relative h-full w-full p-6 sm:p-8 flex flex-col items-center justify-between text-center transition-all duration-700"
               style={{ background: `linear-gradient(145deg, ${palette[0]}, ${palette[1]})` }}>
            
            <div className="space-y-2 mt-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/80 font-bold">{template.name}</p>
              <h2 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-white drop-shadow-md">Linh & Quân</h2>
            </div>

            <div className="mt-auto flex flex-col items-center gap-6 pt-6">
              <div className="text-sm text-white/90 font-medium">
                <p>Trung tâm Sự kiện Rose</p>
                <p className="text-xs text-white/75 mt-1">Hà Nội · 24.10.2026</p>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center gap-3 relative z-20">
                
                {/* Interaction Hint */}
                <AnimatePresence>
                  {!hasInteracted && demoState === "idle" && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: [0, 5, 0] }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ x: { duration: 1.5, repeat: Infinity } }}
                      className="absolute -left-44 top-1/2 -translate-y-1/2 flex items-center gap-2 text-white drop-shadow-lg pointer-events-none"
                    >
                      <span className="text-xs font-bold whitespace-nowrap bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">Nhấn vào QR khám phá</span>
                      <ArrowRight className="size-4" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={triggerExplosion}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); triggerExplosion(); } }}
                  className="group relative cursor-pointer rounded-2xl bg-white p-3 text-foreground shadow-2xl transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] active:scale-95"
                  aria-label="Khám phá cách kỷ niệm xuất hiện từ mã QR"
                >
                  <QrCode className="size-24 sm:size-28 text-slate-800" strokeWidth={1.5} />
                  
                  {/* Idle Subtle Scan */}
                  {demoState === "idle" && !reducedMotion && (
                    <motion.div
                      initial={{ top: "0%" }}
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-x-0 h-0.5 bg-primary/40 shadow-[0_0_8px_var(--primary)]"
                    />
                  )}
                  
                  {/* Exploding Scan */}
                  {demoState === "exploding" && !reducedMotion && (
                    <motion.div
                      initial={{ top: "0%", opacity: 1 }}
                      animate={{ top: "100%", opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="absolute inset-x-0 h-1 bg-white shadow-[0_0_15px_white]"
                    />
                  )}
                </button>
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">
                  Scan to join
                </p>
              </div>
            </div>
          </div>
        </GlowingRunningBorder>
      </motion.div>

      {/* Foreground Layer: Memory Cards (Originates at QR center) */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
        <motion.div style={!isMobile && !reducedMotion ? { x: xFg, y: yFg } : {}} className="relative top-36 w-0 h-0">
          <AnimatePresence>
            {(demoState === "exploding" || demoState === "settled") &&
              floatingContributions.map((item) => {
                const isHovered = hoveredCard === item.id;
                const isOtherHovered = hoveredCard !== null && hoveredCard !== item.id;
                
                // Flight animation scaling for mobile
                const dest = isMobile ? { x: item.dest.x * 0.7, y: item.dest.y * 0.7, r: item.dest.r } : item.dest;
                const flightDuration = 0.6 + item.id * 0.05;
                
                return (
                  <motion.div
                    key={item.id}
                    onMouseEnter={() => !isMobile && setHoveredCard(item.id)}
                    onMouseLeave={() => !isMobile && setHoveredCard(null)}
                    initial={reducedMotion ? { opacity: 0, x: dest.x, y: dest.y, rotate: dest.r } : { opacity: 0, scale: 0.3, x: 0, y: 0, rotate: 0 }}
                    animate={
                      reducedMotion
                        ? { opacity: 1 }
                        : { 
                            opacity: isOtherHovered ? 0.75 : 1, 
                            scale: isHovered ? 1.04 : 1, 
                            x: dest.x, 
                            y: demoState === "settled" && !isHovered && isInView ? [dest.y, dest.y - 6, dest.y] : dest.y, 
                            rotate: isHovered ? 0 : dest.r 
                          }
                    }
                    transition={
                      demoState === "exploding" && !reducedMotion
                        ? { duration: flightDuration, ease: [0.16, 1, 0.3, 1] }
                        : { 
                            y: { duration: 3 + item.id, repeat: Infinity, ease: "easeInOut" },
                            opacity: { duration: 0.2 },
                            scale: { duration: 0.2 },
                            rotate: { duration: 0.2 }
                          }
                    }
                    style={{ zIndex: isHovered ? 50 : 20 }}
                    className={`absolute flex items-center gap-2.5 rounded-2xl border border-white/60 bg-white/80 px-4 py-2.5 text-xs font-semibold text-foreground shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl transition-colors duration-300 pointer-events-auto cursor-pointer ${isHovered ? 'shadow-[0_12px_40px_rgb(0,0,0,0.12)]' : ''}`}
                  >
                    <span className={`flex size-6 items-center justify-center rounded-full bg-slate-100 shadow-sm ${item.accent}`}>
                      <item.icon className="size-3.5" />
                    </span>
                    <span className="opacity-90 whitespace-nowrap">{item.text || item.label}</span>
                    
                    {/* Light Trail (Only during explosion flight) */}
                    {demoState === "exploding" && !reducedMotion && (
                      <motion.div
                        initial={{ opacity: 1, scaleX: 1, scaleY: 1 }}
                        animate={{ opacity: 0, scaleX: 0.1, scaleY: 0.5 }}
                        transition={{ duration: 0.4, delay: flightDuration * 0.3 }}
                        className={`absolute -z-10 h-6 w-16 bg-white/80 blur-md rounded-full origin-left`}
                        style={{
                           // Simple trail trick: align roughly to center
                           left: "50%",
                           top: "50%",
                           transform: `translate(-50%, -50%) rotate(${Math.atan2(-dest.y, -dest.x)}rad) translateX(-40px)`
                        }}
                      />
                    )}
                  </motion.div>
                )
              })}
          </AnimatePresence>
        </motion.div>
      </div>

    </div>
  )
}
