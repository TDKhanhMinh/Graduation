import { posterTemplateSchema, type PosterTemplate } from "./schema"

const graduationGlowTemplateInput = {
  id: "graduation-glow-01",
  name: "Ánh sáng tốt nghiệp",
  version: 1,
  categories: ["graduation", "wedding", "birthday", "corporate", "general"],
  supportedRatios: ["4:5", "9:16"],
  thumbnail: "local://poster-template/graduation-glow-01",
  fonts: ["Geist", "Arial"],
  palette: ["#241b2f", "#5d2d4a", "#c85b45", "#fff4d6"],
  requiredElementIds: ["background", "title", "qr"],
  layouts: {
    "4:5": {
      width: 1080,
      height: 1350,
      safeArea: { top: 80, right: 80, bottom: 80, left: 80 },
      elements: [
        { id: "background", type: "shape", frame: { x: 0, y: 0, width: 1080, height: 1350 }, shape: "rect", fill: "#241b2f", locked: true },
        { id: "title", type: "text", frame: { x: 80, y: 650, width: 920, height: 330 }, bind: "event.title", text: "Lời chúc tốt nghiệp", editable: true, style: { fontFamily: "Geist", fontSize: 82, fontWeight: 700, fill: "#fff9ef", align: "left", lineHeight: 1.17, letterSpacing: 0 }, constraints: { maxLines: 4, minFontSize: 48, maxFontSize: 82, autoFit: true, overflow: "clip" } },
        { id: "qr", type: "qr", frame: { x: 810, y: 1080, width: 190, height: 190 }, bind: "event.publicUrl", minSize: 150, quietZone: 4, foreground: "#111827", background: "#ffffff" },
      ],
    },
    "9:16": {
      width: 1080,
      height: 1920,
      safeArea: { top: 80, right: 80, bottom: 80, left: 80 },
      elements: [
        { id: "background", type: "shape", frame: { x: 0, y: 0, width: 1080, height: 1920 }, shape: "rect", fill: "#241b2f", locked: true },
        { id: "title", type: "text", frame: { x: 80, y: 880, width: 920, height: 420 }, bind: "event.title", text: "Lời chúc tốt nghiệp", editable: true, style: { fontFamily: "Geist", fontSize: 74, fontWeight: 700, fill: "#fff9ef", align: "left", lineHeight: 1.2, letterSpacing: 0 }, constraints: { maxLines: 4, minFontSize: 44, maxFontSize: 74, autoFit: true, overflow: "clip" } },
        { id: "qr", type: "qr", frame: { x: 790, y: 1640, width: 210, height: 210 }, bind: "event.publicUrl", minSize: 160, quietZone: 4, foreground: "#111827", background: "#ffffff" },
      ],
    },
  },
}

export const graduationGlowTemplate: PosterTemplate = posterTemplateSchema.parse(graduationGlowTemplateInput)

const localTemplateVariants = [
  {
    ...graduationGlowTemplateInput,
    id: "minimal-paper-01",
    name: "Giấy tối giản",
    palette: ["#f7f0e6", "#d8c3a5", "#7c5c45", "#2d2925"],
  },
  {
    ...graduationGlowTemplateInput,
    id: "editorial-night-01",
    name: "Đêm biên tập",
    palette: ["#101828", "#344054", "#8fb8de", "#f2f4f7"],
  },
  {
    ...graduationGlowTemplateInput,
    id: "citrus-celebration-01",
    name: "Chúc mừng sắc cam",
    palette: ["#183b2f", "#2e7d5b", "#f2c94c", "#fff8e7"],
  },
] as const

export const localPosterTemplates: readonly PosterTemplate[] = [
  graduationGlowTemplate,
  ...localTemplateVariants.map((template) => posterTemplateSchema.parse(template)),
]
