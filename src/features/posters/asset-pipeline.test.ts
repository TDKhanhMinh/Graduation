import { describe, expect, it } from "vitest"

import {
  POSTER_CROP_PRESETS,
  createLocalPosterAsset,
  getPosterSvgImageAlignment,
  resolvePosterCropRect,
} from "./asset-pipeline"

describe("poster asset pipeline", () => {
  it("keeps a cover crop proportional and focal-point aware", () => {
    const rect = resolvePosterCropRect(2400, 1200, 1080, 1350, POSTER_CROP_PRESETS["right"])

    expect(rect.height).toBe(1200)
    expect(rect.width).toBe(960)
    expect(rect.x).toBe(1152)
    expect(rect.y).toBe(0)
  })

  it("maps crop presets to SVG object-fit alignment", () => {
    expect(getPosterSvgImageAlignment(POSTER_CROP_PRESETS.top)).toBe("xMidYMin cover")
    expect(getPosterSvgImageAlignment(POSTER_CROP_PRESETS.left)).toBe("xMinYMid cover")
  })

  it("creates a stable local asset reference without provider URLs", () => {
    expect(createLocalPosterAsset({
      id: "asset-1",
      kind: "background",
      mimeType: "image/webp",
      width: 1200,
      height: 900,
    })).toMatchObject({
      id: "asset-1",
      path: "local://poster-assets/asset-1",
      external: { provider: "local", providerAssetId: "asset-1", attributionRequired: false },
    })
  })
})
