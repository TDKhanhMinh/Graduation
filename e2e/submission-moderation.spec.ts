import { expect, test } from '@playwright/test'

const eventSlug = 'public-event-1'
const eventId = 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01'

const installTurnstileMock = async (page: import('@playwright/test').Page) => {
  await page.route(
    'https://challenges.cloudflare.com/turnstile/v0/api.js*',
    async (route) => {
      await route.fulfill({
        contentType: 'application/javascript',
        body: `
          window.turnstile = {
            render: (_element, options) => {
              setTimeout(() => options.callback('mock-turnstile-token'), 0)
              return 'mock-widget-id'
            },
            remove: () => {}
          }
        `,
      })
    },
  )
}

const proxySubmitWish = async (page: import('@playwright/test').Page) => {
  await page.route('**/functions/v1/submit-wish', async (route) => {
    const response = await route.fetch()
    await route.fulfill({ response })
  })
}
const loginOwner = async (page: import('@playwright/test').Page) => {
  await page.goto(`/auth/login?next=/dashboard/events/${eventId}/moderation`)
  await page.fill('input[name="email"]', 'owner@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL(new RegExp(`/dashboard/events/${eventId}/moderation`))
}

test.describe('Phase 2: Submission and Moderation Realtime Journey', () => {
  test.beforeEach(async ({ page }) => {
    await installTurnstileMock(page)
  })

  test('Guest submit -> Owner moderate -> Guest sees realtime update', async ({ browser }) => {
    const ownerContext = await browser.newContext()
    const guestContext = await browser.newContext()
    const ownerPage = await ownerContext.newPage()
    const guestPage = await guestContext.newPage()
    await installTurnstileMock(ownerPage)
    await installTurnstileMock(guestPage)
    await proxySubmitWish(guestPage)

    const wishContent = `Hello from E2E Guest ${Date.now()}`
    const wishSender = `E2E Guest ${Date.now()}`

    await loginOwner(ownerPage)

    await guestPage.goto(`/e/${eventSlug}`)
    await expect(guestPage.locator('h1').first()).toBeVisible()
    await guestPage.getByTestId('open-composer').click()
    const dialog = guestPage.getByTestId('wish-composer-dialog')
    await dialog.locator('textarea[name="content"]').fill(wishContent)
    await dialog.locator('form button[type="submit"]').click()
    await dialog.locator('input[name="senderName"]').fill(wishSender)
    await dialog.getByTestId('submit-wish').click()
    await expect(dialog.locator('[aria-live="polite"] h3')).toBeVisible()

    const pendingUrl = `/dashboard/events/${eventId}/moderation?status=pending&search=${encodeURIComponent(wishContent)}`
    await ownerPage.goto(pendingUrl)
    const wishRow = ownerPage.locator('tr', { hasText: wishContent })
    await expect(wishRow).toBeVisible()
    await wishRow.getByRole('checkbox', { name: `Select wish from ${wishSender}` }).check()
    await ownerPage.getByRole('button', { name: 'Approve' }).click()
    await expect(wishRow).toHaveCount(0)

    const guestWishCard = guestPage.locator('.wish-card', { hasText: wishContent })
    await expect(guestWishCard).toBeVisible({ timeout: 10000 })

    await ownerPage.goto(`/dashboard/events/${eventId}/moderation?status=approved&search=${encodeURIComponent(wishContent)}`)
    const approvedRow = ownerPage.locator('tr', { hasText: wishContent })
    await expect(approvedRow).toBeVisible()
    await approvedRow.getByRole('checkbox', { name: `Select wish from ${wishSender}` }).check()
    await ownerPage.getByRole('button', { name: 'Hide' }).click()
    await expect(approvedRow).toHaveCount(0)
    await expect(guestWishCard).toBeHidden({ timeout: 10000 })

    await ownerContext.close()
    await guestContext.close()
  })

  test('Concurrency: Prevent duplicate wishes on double click', async ({ page }) => {
    let requests = 0
    await page.route('**/functions/v1/submit-wish', async (route) => {
      requests += 1
      await new Promise((resolve) => setTimeout(resolve, 500))
      const response = await route.fetch()
      await route.fulfill({ response })
    })

    await page.goto(`/e/${eventSlug}`)
    await page.getByTestId('open-composer').click()
    const dialog = page.getByTestId('wish-composer-dialog')
    await dialog.locator('textarea[name="content"]').fill(`Double click test ${Date.now()}`)
    await dialog.locator('form button[type="submit"]').click()
    await dialog.locator('input[name="senderName"]').fill(`Speedy ${Date.now()}`)
    const submitButton = dialog.getByTestId('submit-wish')
    await expect(submitButton).toBeEnabled()
    await submitButton.dblclick()

    await expect(dialog.locator('[aria-live="polite"] h3')).toBeVisible()
    expect(requests).toBe(1)
  })
})