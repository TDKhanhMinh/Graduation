import { expect, test } from "@playwright/test"
import { randomUUID } from "node:crypto"

const viewports = [
  { name: "mobile", width: 320, height: 800 },
  { name: "tablet", width: 768, height: 900 },
  { name: "desktop", width: 1440, height: 1000 },
]

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/dashboard")
  await expect(page).toHaveURL(/\/auth\/login\?next=(?:%2F|\/)dashboard$/)
  await page.fill('input[name="email"]', "owner@example.com")
  await page.fill('input[name="password"]', "password123")
  await page.click('button[type="submit"]')
  await page.waitForURL("/dashboard")
}

async function assertNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }))
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewportWidth)
}

test("sharing route keeps unauthenticated owner data behind the auth boundary", async ({ page }) => {
  await page.goto("/dashboard/events/00000000-0000-0000-0000-000000000000/sharing")
  await expect(page).toHaveURL(
    /\/auth\/login\?next=(?:%2F|\/)dashboard(?:%2F|\/)events(?:%2F|\/)00000000-0000-0000-0000-000000000000(?:%2F|\/)sharing$/,
  )
})

for (const viewport of viewports) {
  test.describe("owner/public QR sharing - " + viewport.name, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test("renders accessible QR controls without horizontal overflow", async ({ page }, testInfo) => {
      const slug = `qr-${testInfo.workerIndex}-${testInfo.retry}-${randomUUID().slice(0, 12)}`
      await signIn(page)

      await page.goto("/dashboard/events/new")
      await page.fill('input[name="title"]', "QR E2E Event")
      await page.fill('input[name="slug"]', slug)
      await page
        .locator("form")
        .filter({ has: page.locator('input[name="slug"]') })
        .locator('button[type="submit"]')
        .click()
      await page.waitForURL(/\/dashboard\/events\/[a-f0-9-]{36}/)

      const eventPath = new URL(page.url()).pathname
      await page.goto(`${eventPath}/sharing`)
      await expect(page.getByRole("heading", { name: "Chia sẻ & QR" })).toBeVisible()
      await expect(page.getByRole("img", { name: "Mã QR mở trang sự kiện công khai" })).toBeVisible()
      await expect(page.getByRole("button", { name: "Chia sẻ" })).toBeVisible()
      await expect(page.getByRole("button", { name: "Sao chép liên kết" })).toBeVisible()
      await expect(page.getByRole("button", { name: "Tải PNG" })).toBeVisible()
      await expect(page.getByRole("button", { name: "In mã QR" })).toBeVisible()
      await assertNoHorizontalOverflow(page)

      await page.goto(`/e/${slug}`)
      const qrButton = page.getByRole("button", { name: "Mở mã QR sự kiện" })
      await expect(qrButton).toBeVisible()
      await qrButton.focus()
      await expect(qrButton).toBeFocused()
      await qrButton.click()
      await expect(qrButton).toHaveAttribute("aria-expanded", "true")
      await expect(page.getByRole("region", { name: "Mã QR mở trang sự kiện" })).toBeVisible()
      await expect(page.getByRole("img", { name: "Mã QR mở trang sự kiện công khai" })).toBeVisible()
      await expect(page.getByRole("button", { name: "Đóng mã QR sự kiện" })).toBeVisible()
      await assertNoHorizontalOverflow(page)
    })
  })
}