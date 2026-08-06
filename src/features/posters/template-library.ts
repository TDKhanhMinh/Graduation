import { localPosterTemplates } from "./templates"
import {
  posterEventCategorySchema,

  posterTemplateSchema,
  type PosterEventCategory,
  type PosterRatio,
  type PosterTemplate,
} from "./schema"

const libraryRatios: PosterRatio[] = ["4:5", "9:16", "1:1", "16:9"]
const ratioDimensions: Record<PosterRatio, { width: number; height: number }> = {
  "4:5": { width: 1080, height: 1350 },
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "16:9": { width: 1920, height: 1080 },
}

const libraryNames = [
  "Aurora Memory",
  "Soft Vows",
  "Paper Bloom",
  "Midnight Toast",
  "Golden Hour",
  "Modern Ceremony",
  "Quiet Celebration",
  "Citrus Notes",
  "Velvet Archive",
  "Warm Horizon",
  "Clean Milestone",
  "Garden Letter",
  "Afterglow",
  "Monochrome Story",
  "Sunlit Table",
  "The Memory Edit",
] as const

function scaleLayout(source: PosterTemplate["layouts"]["4:5"], ratio: PosterRatio) {
  const dimensions = ratioDimensions[ratio]
  const scaleX = dimensions.width / source.width
  const scaleY = dimensions.height / source.height
  const fontScale = Math.min(scaleX, scaleY)

  return {
    width: dimensions.width,
    height: dimensions.height,
    safeArea: {
      top: Math.round(source.safeArea.top * scaleY),
      right: Math.round(source.safeArea.right * scaleX),
      bottom: Math.round(source.safeArea.bottom * scaleY),
      left: Math.round(source.safeArea.left * scaleX),
    },
    elements: source.elements.map((element) => {
      const frame = {
        x: Math.round(element.frame.x * scaleX),
        y: Math.round(element.frame.y * scaleY),
        width: Math.max(1, Math.round(element.frame.width * scaleX)),
        height: Math.max(1, Math.round(element.frame.height * scaleY)),
      }
      if (element.type === "text") {
        return {
          ...element,
          frame,
          style: { ...element.style, fontSize: Math.max(12, Math.round(element.style.fontSize * fontScale)) },
          constraints: {
            ...element.constraints,
            minFontSize: Math.max(10, Math.round(element.constraints.minFontSize * fontScale)),
            maxFontSize: Math.max(12, Math.round(element.constraints.maxFontSize * fontScale)),
          },
        }
      }
      if (element.type === "qr") {
        return { ...element, frame, minSize: Math.max(120, Math.round(element.minSize * fontScale)) }
      }
      return { ...element, frame }
    }),
  }
}

function createLibraryTemplate(source: PosterTemplate, index: number, name: string, category: PosterEventCategory) {
  const sourceLayout = source.layouts["4:5"]
  const layouts = { ...source.layouts }
  for (const ratio of libraryRatios) {
    if (!layouts[ratio]) layouts[ratio] = scaleLayout(sourceLayout, ratio)
  }

  return posterTemplateSchema.parse({
    ...source,
    id: `poster-library-${String(index + 1).padStart(2, "0")}`,
    name,
    categories: [category, "general"],
    supportedRatios: libraryRatios,
    thumbnail: `local://poster-template/poster-library-${String(index + 1).padStart(2, "0")}`,
    layouts,
  })
}

export const posterTemplateLibrary: readonly PosterTemplate[] = libraryNames.map((name, index) => {
  const source = localPosterTemplates[index % localPosterTemplates.length]
  const category = posterEventCategorySchema.options[index % posterEventCategorySchema.options.length]
  return createLibraryTemplate(source, index, name, category)
})

export type PosterTemplateLibraryFilter = {
  query?: string
  category?: PosterEventCategory
  ratio?: PosterRatio
  favoriteIds?: readonly string[]
}

export function filterPosterTemplateLibrary(
  templates: readonly PosterTemplate[] = posterTemplateLibrary,
  filter: PosterTemplateLibraryFilter = {},
) {
  const query = filter.query?.trim().toLowerCase()
  const favorites = new Set(filter.favoriteIds ?? [])

  return templates.filter((template) => {
    if (filter.category && !template.categories.includes(filter.category)) return false
    if (filter.ratio && !template.supportedRatios.includes(filter.ratio)) return false
    if (query && !template.name.toLowerCase().includes(query) && !template.id.includes(query)) return false
    if (filter.favoriteIds && !favorites.has(template.id)) return false
    return true
  })
}

export function togglePosterTemplateFavorite(favoriteIds: readonly string[], templateId: string) {
  return favoriteIds.includes(templateId)
    ? favoriteIds.filter((id) => id !== templateId)
    : [...favoriteIds, templateId]
}

export function recordRecentPosterTemplate(recentIds: readonly string[], templateId: string, limit = 5) {
  return [templateId, ...recentIds.filter((id) => id !== templateId)].slice(0, limit)
}
