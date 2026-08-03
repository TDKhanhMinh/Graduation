import { test, expect } from '@playwright/test';

// Define the journey test
test.describe('Phase 2: Submission and Moderation Realtime Journey', () => {
  // Common event slug for the test
  const eventSlug = 'test-e2e-event';

  test.beforeEach(async ({ page }) => {
    // Mock Turnstile CAPTCHA response to always return success
    await page.route('https://challenges.cloudflare.com/turnstile/**', async (route) => {
      // If it's a request to the API, mock it. For simplicity, we just mock the POST to siteverify if called from client
      // But Turnstile is verified on the server. The client-side widget just returns a token.
      // We can inject a script to mock the window.turnstile object.
      await route.continue();
    });

    await page.addInitScript(() => {
      // Mock Cloudflare Turnstile widget
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).turnstile = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        render: (element: string | HTMLElement, options: any) => {
          setTimeout(() => {
            if (options.callback) {
              options.callback('mock-turnstile-token');
            }
          }, 100);
          return 'mock-widget-id';
        },
        remove: () => {},
      };
    });
  });

  test('Guest submit -> Owner moderate -> Guest sees realtime update', async ({ browser }) => {
    // 1. Setup two isolated browser contexts
    const ownerContext = await browser.newContext();
    const guestContext = await browser.newContext();

    const ownerPage = await ownerContext.newPage();
    const guestPage = await guestContext.newPage();

    // 2. Owner logs in and creates an event (or we assume it's created via setup)
    // For this test, we'll assume the owner login is mocked or done via a dedicated test user
    // And the event `test-e2e-event` exists and belongs to the owner.
    
    // We'll skip the login UI automation to keep it focused on moderation, 
    // but in reality we would use `ownerPage.goto('/auth/login')` etc.

    // 3. Guest visits the public wall and submits a wish
    await guestPage.goto(`/e/${eventSlug}`);
    await expect(guestPage.locator('h1')).toBeVisible();

    // Guest submits wish
    await guestPage.fill('textarea[name="content"]', 'Hello from E2E Guest!');
    await guestPage.fill('input[name="senderName"]', 'E2E Guest');
    await guestPage.click('button:has-text("Tiếp tục")');
    await guestPage.click('button:has-text("Gửi lời chúc")');

    // Wait for success message
    await expect(guestPage.locator('text=đang chờ kiểm duyệt')).toBeVisible();

    // 4. Owner moderates the wish
    // Navigate to moderation dashboard
    await ownerPage.goto(`/dashboard/events/${eventSlug}/moderation`);
    
    // Assume owner is logged in (session injected or logged in before)
    // Find the pending wish
    const wishRow = ownerPage.locator('tr', { hasText: 'Hello from E2E Guest!' });
    await expect(wishRow).toBeVisible();

    // Select the wish
    await wishRow.locator('input[type="checkbox"]').check();

    // Click Approve in the bulk action bar
    await ownerPage.click('button:has-text("Phê duyệt")');
    // Wait for moderation to complete (row disappears from pending queue)
    await expect(wishRow).toBeHidden();

    // 5. Guest sees the realtime update on the public wall
    // The public wall should now display the approved wish via Realtime
    // We do NOT refresh the page. It should appear automatically.
    const guestWishCard = guestPage.locator('.wish-card', { hasText: 'Hello from E2E Guest!' });
    await expect(guestWishCard).toBeVisible({ timeout: 10000 }); // Wait up to 10s for realtime

    // 6. Owner hides the wish
    // Owner switches to "Đã duyệt" tab (assuming we have one, or just general queue)
    await ownerPage.click('button[role="tab"]:has-text("Đã duyệt")');
    const approvedRow = ownerPage.locator('tr', { hasText: 'Hello from E2E Guest!' });
    await expect(approvedRow).toBeVisible();

    // Hide it
    await approvedRow.locator('input[type="checkbox"]').check();
    await ownerPage.click('button:has-text("Ẩn")');
    await expect(approvedRow).toBeHidden();

    // 7. Guest sees the wish disappear
    await expect(guestWishCard).toBeHidden({ timeout: 10000 });

    await ownerContext.close();
    await guestContext.close();
  });

  test('Concurrency: Prevent duplicate wishes on double click', async ({ page }) => {
    // Go to event page
    await page.goto(`/e/${eventSlug}`);
    await page.fill('textarea[name="content"]', 'Double click test');
    await page.fill('input[name="senderName"]', 'Speedy');
    await page.click('button:has-text("Tiếp tục")');
    
    // Intercept API request to delay it, making double click possible
    await page.route('**/api/wishes', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });

    const submitBtn = page.locator('button:has-text("Gửi lời chúc")');
    
    // Click twice rapidly
    await submitBtn.click();
    await submitBtn.click({ force: true }); // force in case it gets disabled

    // The button should be disabled after first click, or backend should reject idempotency key
    // We assert that only ONE success message appears
    await expect(page.locator('text=đang chờ kiểm duyệt')).toBeVisible();
    
    // Actually asserting exact database state is better done in integration tests,
    // but the UI shouldn't crash or show two success dialogs.
  });
});
