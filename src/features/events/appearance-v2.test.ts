import { describe, expect, it } from "vitest"

import { appearanceSchema } from "./schema"

describe("appearance schema", () => {
  it("provides safe V2 defaults for existing appearance forms", () => {
    const result = appearanceSchema.safeParse({
      theme_key: "graduation",
      cover_path: "",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.experience_preset).toBe("minimal")
      expect(result.data.effect_quality).toBe("auto")
      expect(result.data.wall_layout).toBe("spotlight")
    }
  })

  it("accepts all six V2 presets and rejects unsupported values", () => {
    for (const experience_preset of ["minimal", "elegant", "romantic", "graduation", "celebration", "galaxy"]) {
      expect(appearanceSchema.safeParse({ theme_key: "graduation", experience_preset, cover_path: "" }).success).toBe(true)
    }

    expect(appearanceSchema.safeParse({ theme_key: "graduation", experience_preset: "cinematic", cover_path: "" }).success).toBe(false)
    expect(appearanceSchema.safeParse({ theme_key: "graduation", effect_quality: "ultra", cover_path: "" }).success).toBe(false)
  })

  it("accepts a Cloudinary delivery URL and rejects lookalike hosts", () => {
    expect(appearanceSchema.safeParse({
      theme_key: "graduation",
      cover_path: "https://res.cloudinary.com/demo/image/upload/v1/cover.webp",
    }).success).toBe(true)
    expect(appearanceSchema.safeParse({
      theme_key: "graduation",
      cover_path: "https://res.cloudinary.com.attacker.example/cover.webp",
    }).success).toBe(false)
  })
})
