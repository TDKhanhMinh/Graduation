import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

test.describe('Foundation Journey', () => {
  test('should sign up, create an event, and view public wall', async ({ page }, testInfo) => {
    const eventSlug = `e2e-${testInfo.workerIndex}-${testInfo.retry}-${randomUUID().slice(0, 18)}`;
    const updatedEventSlug = `${eventSlug}-updated`;

    // 1. Enter through the protected route so auth preserves the destination.
    await page.goto('/dashboard/events/00000000-0000-0000-0000-000000000000/settings');
    await expect(page).toHaveURL(
      /\/auth\/login\?next=(?:%2F|\/)dashboard(?:%2F|\/)events(?:%2F|\/)00000000-0000-0000-0000-000000000000(?:%2F|\/)settings$/
    );

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/login\?next=(?:%2F|\/)dashboard$/);
    await page.fill('input[name="email"]', 'owner@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Sự kiện của bạn');

    // 2. Create Event
    await page.goto('/dashboard/events/new');
    await page.fill('input[name="title"]', 'My E2E Event');
    await page.fill('input[name="slug"]', eventSlug);
    await page
      .locator('form')
      .filter({ has: page.locator('input[name="slug"]') })
      .locator('button[type="submit"]')
      .click();

    // Wait for redirect to event overview
    await page.waitForURL(/\/dashboard\/events\/[a-f0-9-]{36}/);
    await expect(page.locator('h1').first()).toContainText('My E2E Event');
    const eventPath = new URL(page.url()).pathname;

    // 3. Update settings and verify the changed public slug/title.
    await page.goto(`${eventPath}/settings`);
    await page.fill('input[name="title"]', 'My Updated E2E Event');
    await page.fill('input[name="slug"]', updatedEventSlug);
    await page.fill('input[name="description"]', 'Updated from the Foundation E2E flow');
    await page
      .locator('form')
      .filter({ has: page.locator('input[name="slug"]') })
      .locator('button[type="submit"]')
      .click();

    // 4. View Public Wall
    await page.goto(`/e/${updatedEventSlug}`);
    await expect(page.locator('h1').first()).toContainText('My Updated E2E Event');
    await expect(page.locator('text=Updated from the Foundation E2E flow')).toBeVisible();
    await expect(page.locator('text=Hãy là người đầu tiên gửi lời chúc!')).toBeVisible();

    await page.goto('/e/public-event-1');
    await expect(page.locator('text=Congratulations!')).toBeVisible();
    const publicHtml = await page.content();
    expect(publicHtml).not.toContain('Pending wish');
    expect(publicHtml).not.toContain('Spam wish');
    expect(publicHtml).not.toContain('Hidden wish');

    await page.goto('/e/private-event-1');
    await expect(page.locator('h1')).toContainText('Không tìm thấy sự kiện');

    await page.goto('/e/unlisted-event-1');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex/
    );
  });
});
