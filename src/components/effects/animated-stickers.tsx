"use client"

import Image from "next/image"
import type { ReactNode } from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export type AnimeStickerItem = {
  id: string
  name: string
  src: string
  emojiFallback: string
  tag: string
}

export const ANIME_STICKERS: AnimeStickerItem[] = [
  {
    id: "anime-party",
    name: "Chibi Party Girl",
    src: "/stickers/anime-party.png",
    emojiFallback: "🥳",
    tag: "Tiệc Mừng",
  },
  {
    id: "anime-heart",
    name: "Neko Sparkle Heart",
    src: "/stickers/anime-heart.png",
    emojiFallback: "💖",
    tag: "Yêu Thích",
  },
  {
    id: "anime-crown",
    name: "Chibi Prince Crown",
    src: "/stickers/anime-crown.png",
    emojiFallback: "👑",
    tag: "VIP Royal",
  },
]

export type AnimatedStickerProps = {
  sticker: AnimeStickerItem
  size?: "sm" | "md" | "lg"
  className?: string
  animated?: boolean
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export function AnimatedSticker({
  sticker,
  size = "md",
  className,
  animated = true,
  onClick,
}: AnimatedStickerProps) {
  const sizeMap = {
    sm: "size-10 sm:size-12",
    md: "size-14 sm:size-16",
    lg: "size-20 sm:size-24",
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center rounded-2xl border-2 border-white/60 bg-gradient-to-b from-white/90 to-amber-100/90 p-1 shadow-lg transition-all duration-300 hover:scale-125 hover:rotate-6 hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] active:scale-95",
        sizeMap[size],
        animated && "animate-bounce-subtle",
        className,
      )}
      title={sticker.name}
    >
      <div className="relative size-full overflow-hidden rounded-xl">
        <Image
          src={sticker.src}
          alt={sticker.name}
          fill
          sizes="(max-width: 640px) 48px, 96px"
          className="object-contain drop-shadow-md transition-transform duration-300 hover:scale-110"
          onError={(e) => {
            // Hide broken image if fallback needed
            const target = e.currentTarget as HTMLElement
            target.style.display = "none"
          }}
        />
        {/* Emoji fallback indicator */}
        <span className="absolute inset-0 flex items-center justify-center text-xl sm:text-2xl font-bold select-none opacity-0 hover:opacity-100 transition-opacity">
          {sticker.emojiFallback}
        </span>
      </div>
    </button>
  )
}

export type FloatingStickerParticle = {
  id: number
  sticker: AnimeStickerItem
  x: number
  y: number
}

export function useStickerReactions() {
  const [floatingStickers, setFloatingStickers] = useState<FloatingStickerParticle[]>([])

  const spawnStickerReaction = (sticker: AnimeStickerItem, clientX?: number, clientY?: number) => {
    const x = clientX ?? window.innerWidth / 2 + (Math.random() * 100 - 50)
    const y = clientY ?? window.innerHeight / 2 + (Math.random() * 60 - 30)
    const newParticle: FloatingStickerParticle = {
      id: Date.now() + Math.random(),
      sticker,
      x,
      y,
    }

    setFloatingStickers((prev) => [...prev, newParticle])

    setTimeout(() => {
      setFloatingStickers((prev) => prev.filter((p) => p.id !== newParticle.id))
    }, 1500)
  }

  return {
    floatingStickers,
    spawnStickerReaction,
  }
}

export function StickerReactionLayer({ particles }: { particles: FloatingStickerParticle[] }) {
  if (particles.length === 0) return null

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[85] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          style={{ left: p.x - 28, top: p.y - 28 }}
          className="fixed size-14 sm:size-16 animate-out fade-out slide-out-to-top-24 duration-1000 ease-out"
        >
          <div className="relative size-full rounded-2xl border-2 border-amber-300 bg-background/90 p-1 shadow-[0_0_20px_rgba(251,191,36,0.7)] animate-spin-slow">
            <Image
              src={p.sticker.src}
              alt={p.sticker.name}
              fill
              sizes="64px"
              className="object-contain"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
