import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import test from "node:test"

const root = process.cwd()

function source(path) {
  return readFileSync(resolve(root, path), "utf8")
}

function assertSource(path, pattern, message) {
  assert.match(source(path), pattern, `${path}: ${message}`)
}

test("responsive foundation keeps the release breakpoints and mobile dashboard shell", () => {
  assertSource("src/app/globals.css", /@media\s*\(min-width:\s*768px\)/, "tablet breakpoint")
  assertSource("src/app/globals.css", /@media\s*\(min-width:\s*1024px\)/, "desktop breakpoint")
  assertSource("src/app/dashboard/layout.tsx", /DashboardNav mobile/, "mobile navigation")
  assertSource("src/app/dashboard/layout.tsx", /lg:block/, "desktop navigation boundary")
})

test("public and editor surfaces have bounded mobile layouts", () => {
  assertSource("src/app/(public)/e/[slug]/page.tsx", /overflow-x-clip/, "public page horizontal clipping boundary")
  assertSource("src/app/(public)/e/[slug]/page.tsx", /safe-area-inset-bottom/, "public sticky CTA safe area")
  assertSource("src/components/wish-composer/WishComposer.tsx", /min-h-dvh/, "mobile composer viewport")
  assertSource("src/components/wish-composer/WishComposer.tsx", /lg:grid-cols-/, "wide composer layout boundary")
  assertSource("src/components/posters/PosterAdvancedEditor.tsx", /md:block/, "advanced editor tablet boundary")
  assertSource("src/components/posters/PosterAdvancedEditor.tsx", /Tạo nhanh/, "mobile quick-create path")
})

test("dense dashboard surfaces use a mobile alternative or bounded scrolling", () => {
  assertSource("src/components/moderation/ModerationQueue.tsx", /lg:block/, "desktop moderation table")
  assertSource("src/components/moderation/ModerationQueue.tsx", /lg:hidden/, "mobile moderation cards")
  assertSource("src/components/insights/insights-dashboard.tsx", /overflow-x-auto/, "bounded insights table scroll")
  assertSource("src/components/insights/insights-dashboard.tsx", /min-w-\[38rem\]/, "readable insights table minimum width")
  assertSource("src/components/exports/export-center.tsx", /max-w|grid|flex/, "export page responsive layout")
  assertSource("src/app/dashboard/events/[id]/poster-studio/page.tsx", /PosterAssetLibrary|grid|flex/, "poster studio responsive layout")
})

test("mobile overlays and fixed actions preserve touch targets and safe areas", () => {
  assertSource("src/components/event-welcome/WelcomeSplashModal.tsx", /size-11/, "sticker selector touch target")
  assertSource("src/components/event-welcome/WelcomeSplashModal.tsx", /overscroll-contain/, "splash scroll containment")
  assertSource("src/components/guided-tour/TourCard.tsx", /min-h-11 min-w-11/, "guided tour controls")
  assertSource("src/components/ui/confirm-dialog.tsx", /overflow-y-auto overscroll-contain/, "confirm dialog long-content scroll")
  assertSource("src/components/ui/confirm-dialog.tsx", /pb-\[max\(1\.5rem,env\(safe-area-inset-bottom\)\)\]/, "confirm dialog safe area")
  assertSource("src/components/moderation/BulkActionBar.tsx", /bottom-\[max\(0\.75rem,env\(safe-area-inset-bottom\)\)\]/, "bulk action safe area")
})
