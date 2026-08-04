import { expect, test } from "@playwright/test"

const viewports = [
  { name: "mobile", width: 320, height: 800 },
  { name: "tablet", width: 768, height: 900 },
  { name: "desktop", width: 1440, height: 1000 },
]

for (const viewport of viewports) {
  test.describe("UI refresh smoke - " + viewport.name, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test("landing keeps keyboard entry points and no horizontal overflow", async ({ page }) => {
      await page.goto("/")
      await expect(page.locator("#main-content")).toBeVisible()
      await expect(page.getByRole("link", { name: "Bỏ qua đến nội dung chính" })).toHaveAttribute(
        "href",
        "#main-content",
      )
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible()

      const layout = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      }))
      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewportWidth)
    })

    test("auth surface exposes labeled controls and no horizontal overflow", async ({ page }) => {
      await page.goto("/auth/login")
      await expect(page.locator("#main-content")).toBeVisible()
      await expect(page.getByLabel("Email")).toBeVisible()
      await expect(page.getByLabel("Mật khẩu")).toBeVisible()
      await expect(page.getByRole("link", { name: "Đăng ký" })).toBeVisible()

      const layout = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      }))
      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewportWidth)
    })
  })
}

test("protected route preserves destination and exposes auth entry", async ({ page }) => {
  await page.goto("/dashboard")
  await expect(page).toHaveURL(/\/auth\/login\?next=(?:%2F|\/)dashboard$/)
  await expect(page.locator("#main-content")).toBeVisible()
  await expect(page.getByRole("button", { name: "Đăng nhập" })).toBeVisible()
})