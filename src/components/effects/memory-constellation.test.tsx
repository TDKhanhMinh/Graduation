import { render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it } from "vitest"

import type { PublicWish } from "@/features/wishes/dal"

import { MemoryConstellation } from "./memory-constellation"

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  })
})

const wish = {
  id: "wish-1",
  sender_name: "Lan",
  content: "Chúc mừng!",
  is_pinned: true,
  media: { path: "image.jpg", type: "image", mime_type: "image/jpeg" },
  reactions: [{ reaction: "heart", count: 3 }],
} as unknown as PublicWish

describe("MemoryConstellation", () => {
  it("renders an informative accessible waiting state with zero wishes", () => {
    render(<MemoryConstellation wishes={[]} preset="minimal" intensity="low" mode="waiting" />)

    expect(screen.getByText("Waiting for the next memory…")).toBeInTheDocument()
    expect(screen.getByText(/No approved memories are available yet/)).toBeInTheDocument()
  })

  it("exposes wish metadata in the accessible fallback", () => {
    render(<MemoryConstellation wishes={[wish]} preset="galaxy" intensity="low" mode="summary" />)

    expect(screen.getByText(/Lan: Chúc mừng!/)).toBeInTheDocument()
    expect(screen.getByText(/Pinned/)).toBeInTheDocument()
    expect(screen.getByText(/Includes media/)).toBeInTheDocument()
  })
})
