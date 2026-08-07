import { expect, test } from "@playwright/test";

test.describe("Welcome Tour Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to simulate first visit
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test("should show welcome splash, then tour prompt, then run tour", async ({
    page,
  }) => {
    // Navigate to a valid public event page
    // Note: The specific slug should exist in the local fixture, e.g., /e/test
    await page.goto("/e/test");

    // 1. Splash should open (envelope)
    // There should be a button to open the invitation
    const openButton = page
      .locator("button", { hasText: /Mở thiệp|Open/i })
      .first();
    await expect(openButton).toBeVisible();
    await openButton.click();

    // 2. Wait for splash to close
    // After clicking, the envelope opens and splash modal eventually closes
    // Wait for the modal to disappear
    await expect(
      page.locator('[role="dialog"].welcome-splash'),
    ).not.toBeVisible({ timeout: 10000 });

    // 3. Tour prompt should appear
    const tourPrompt = page.locator('text="Hướng dẫn tham gia"');
    await expect(tourPrompt).toBeVisible();

    // Check if Mascot is visible in prompt
    const mascot = page.locator(".invitation-sticker-scene");
    await expect(mascot).toBeVisible();

    // 4. Start the tour
    const startTourBtn = page.locator("button", { hasText: "Bắt đầu" });
    await expect(startTourBtn).toBeVisible();
    await startTourBtn.click();

    // 5. Tour running
    const tourDialog = page.locator(
      '[role="dialog"][aria-labelledby="tour-step-title"]',
    );
    await expect(tourDialog).toBeVisible();

    // 6. Navigation
    const nextBtn = page.locator("button", { hasText: "Tiếp theo" });
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
    }

    const completeBtn = page
      .locator("button", { hasText: /Hoàn tất|Bỏ qua/i })
      .first();
    if (await completeBtn.isVisible()) {
      await completeBtn.click();
    }

    // 7. Tour finishes
    await expect(tourDialog).not.toBeVisible();
  });
});
