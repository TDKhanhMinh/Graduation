import { expect, test } from '@playwright/test'

test.describe('Public Wall pagination', () => {
  test('renders the initial server batch then loads each same-timestamp wish once', async ({ page }) => {
    await page.goto('/e/pagination-event-1')

    await expect(page.getByText('Pagination wish 22')).toBeVisible()
    await expect(page.getByText('Pagination wish 1')).not.toBeVisible()

    await page.getByRole('button', { name: 'T\u1ea3i th\u00eam l\u1eddi ch\u00fac' }).click()

    await expect(page.getByText('Pagination wish 1')).toBeVisible()
    await expect(page.getByText('Pagination wish 2')).toBeVisible()
    await expect(page.getByText('Pagination wish 22')).toHaveCount(1)
    await expect(page.getByText('\u0110\u00e3 t\u1ea3i t\u1ea5t c\u1ea3 l\u1eddi ch\u00fac.')).toBeVisible()
  })
})
