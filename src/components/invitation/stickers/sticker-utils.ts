export interface Rect {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

export function getExclusionRects(selectors: string[]): Rect[] {
  if (typeof document === "undefined") return []

  const rects: Rect[] = []
  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector)
      elements.forEach((el) => {
        const bounds = el.getBoundingClientRect()
        rects.push({
          left: bounds.left,
          top: bounds.top,
          right: bounds.right,
          bottom: bounds.bottom,
          width: bounds.width,
          height: bounds.height,
        })
      })
    } catch {
      // Ignore invalid selectors
    }
  }

  return rects
}

export function isPointInRect(x: number, y: number, rect: Rect, padding = 0): boolean {
  return (
    x >= rect.left - padding &&
    x <= rect.right + padding &&
    y >= rect.top - padding &&
    y <= rect.bottom + padding
  )
}

export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = (err) => reject(err)
    img.src = src
  })
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
