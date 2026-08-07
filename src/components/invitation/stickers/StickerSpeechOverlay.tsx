"use client"

import { AnimatePresence, motion } from "framer-motion"
import type { StickerSnapshot } from "./types"

export interface StickerSpeechOverlayProps {
  snapshots: StickerSnapshot[]
}

export function StickerSpeechOverlay({ snapshots }: StickerSpeechOverlayProps) {
  const activeSpeechCharacters = snapshots.filter((s) => Boolean(s.activeSpeech))

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      <AnimatePresence>
        {activeSpeechCharacters.map((char) => {
          // Adjust speech bubble position above sticker
          const bubbleX = char.x
          const bubbleY = char.y - char.height / 2 - 12

          return (
            <motion.div
              key={`${char.id}-speech`}
              initial={{ opacity: 0, scale: 0.7, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{
                left: `${bubbleX}px`,
                top: `${bubbleY}px`,
                transform: "translate(-50%, -100%)",
              }}
              className="absolute z-40 max-w-[200px] select-none rounded-2xl border border-amber-400/50 bg-background/95 px-3 py-2 text-center text-xs font-semibold text-foreground shadow-lg backdrop-blur-sm sm:max-w-[240px] sm:text-sm"
            >
              <div className="relative">
                <span>{char.activeSpeech}</span>
                {/* Speech Bubble Arrow */}
                <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 border-8 border-transparent border-t-background/95" />
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
