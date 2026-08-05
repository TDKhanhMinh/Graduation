import { expect, test } from "@playwright/test"

test("owner can sign out and loses dashboard access", async ({ page }) => {
  await page.goto("/dashboard")
  await expect(page).toHaveURL(/login/)

  await page.fill('input[name="email"]', "owner@example.com")
  await page.fill('input[name="password"]', "password123")
  await page.click('button[type="submit"]')
  await page.waitForURL("/dashboard")

  await page.locator("header form button").click()
  await expect(page).toHaveURL("/auth/login")

  await page.goto("/dashboard")
  await expect(page).toHaveURL(/login/)
})
