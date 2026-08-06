export const POSTER_RATIOS = ["4:5", "9:16"] as const

export type PosterRatio = (typeof POSTER_RATIOS)[number]

export type PosterDimensions = {
  width: number
  height: number
}

export type PosterDraft = {
  ratio: PosterRatio
  title: string
  tagline: string
  date: string
  location: string
  accent: string
  imageDataUrl: string
}

const DIMENSIONS: Record<PosterRatio, PosterDimensions> = {
  "4:5": { width: 1080, height: 1350 },
  "9:16": { width: 1080, height: 1920 },
}

export function getPosterDimensions(ratio: PosterRatio): PosterDimensions {
  return DIMENSIONS[ratio]
}

export function wrapPosterText(value: string, maxCharsPerLine: number): string[] {
  const normalized = value.trim().replace(/\s+/g, " ")
  if (!normalized) return []
  if (maxCharsPerLine < 1) return [normalized]

  const words = normalized.split(" ")
  const lines: string[] = []
  let current = ""

  for (const word of words) {
    if (word.length > maxCharsPerLine) {
      if (current) {
        lines.push(current)
        current = ""
      }

      for (let index = 0; index < word.length; index += maxCharsPerLine) {
        lines.push(word.slice(index, index + maxCharsPerLine))
      }
      continue
    }

    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= maxCharsPerLine) {
      current = candidate
    } else {
      lines.push(current)
      current = word
    }
  }

  if (current) lines.push(current)
  return lines
}

export function formatPosterDate(value: string): string {
  if (!value) return ""
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}
