import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { createLocalStockProvider, createPexelsStockProvider, toPosterAsset } from "./stock-provider"

describe("stock provider contract", () => {
  it("keeps local-first creation independent from stock providers", async () => {
    await expect(createLocalStockProvider().search("graduation")).resolves.toMatchObject({
      images: [],
      fallback: true,
      error: "not_configured",
    })
  })

  it("does not call a provider when the server key is missing", async () => {
    const fetchImpl = vi.fn()
    const provider = createPexelsStockProvider({ apiKey: "" , fetchImpl })

    await expect(provider.search("wedding")).resolves.toMatchObject({ error: "not_configured" })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it("maps attribution and caches successful provider responses", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      photos: [{
        id: 42,
        width: 1600,
        height: 1000,
        photographer: "A Photographer",
        photographer_url: "https://pexels.com/@photographer",
        src: { medium: "https://images.example/medium.jpg", original: "https://images.example/original.jpg" },
      }],
    }), { status: 200, headers: { "content-type": "application/json" } }))
    const provider = createPexelsStockProvider({ apiKey: "server-only-key", fetchImpl, now: () => 1000 })

    const first = await provider.search("garden")
    const second = await provider.search("garden")
    expect(first.images[0]).toMatchObject({ id: "42", attribution: { attributionRequired: true } })
    expect(second).toEqual(first)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(toPosterAsset(first.images[0]!)).toMatchObject({
      external: { provider: "pexels", providerAssetId: "42", attributionRequired: true },
    })
  })

  it("returns a fallback result for provider failures and rate limits", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("rate limited", { status: 429 }))
    const provider = createPexelsStockProvider({ apiKey: "server-only-key", fetchImpl, now: () => 1000 })

    await expect(provider.search("one")).resolves.toMatchObject({ error: "rate_limited", fallback: true })
    await expect(provider.search("two")).resolves.toMatchObject({ error: "rate_limited", fallback: true })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})
