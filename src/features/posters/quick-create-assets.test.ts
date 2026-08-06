import { describe, expect, it } from "vitest"

import { createLocalPosterAsset } from "./asset-pipeline"
import { createPosterDocumentFromQuickCreate } from "./quick-create"

describe("quick create asset references", () => {
  it("stores the local asset id and crop in the poster document", () => {
    const asset = createLocalPosterAsset({
      id: "background-1",
      kind: "background",
      mimeType: "image/webp",
      width: 1600,
      height: 1000,
    })
    const document = createPosterDocumentFromQuickCreate({
      eventId: "event-1",
      eventCategory: "general",
      templateId: "minimal-paper-01",
      ratio: "4:5",
      title: "A local poster",
      tagline: "",
      date: "",
      location: "",
      publicUrl: "https://example.com/e/local",
      accent: "#7c5c45",
      backgroundAsset: asset,
      backgroundCrop: { fit: "cover", focalX: 0.8, focalY: 0.2, scale: 1.2 },
    })

    expect(document.assets).toEqual([asset])
    expect(document.content.backgroundAssetId).toBe("background-1")
    expect(document.elements.find((element) => element.id === "local-background")).toMatchObject({
      type: "image",
      assetId: "background-1",
      crop: { focalX: 0.8, focalY: 0.2, scale: 1.2 },
    })
  })
})

