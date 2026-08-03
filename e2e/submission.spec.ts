import { expect, test } from "@playwright/test"

const installTurnstileMock = async (page: import("@playwright/test").Page) => {
  await page.route(
    "https://challenges.cloudflare.com/turnstile/v0/api.js*",
    async (route) => {
      await route.fulfill({
        contentType: "application/javascript",
        body: `
          window.turnstile = {
            render: (_element, options) => {
              setTimeout(() => options.callback("playwright-captcha-token"), 0);
              return "playwright-widget";
            },
            remove: () => {}
          };
        `,
      })
    }
  )
}

test.describe("Wish Composer", () => {
  test("keeps one in-flight submission and shows pending result", async ({
    page,
  }) => {
    await installTurnstileMock(page)
    let requests = 0

    await page.route("**/functions/v1/submit-wish", async (route) => {
      requests += 1
      await new Promise((resolve) => setTimeout(resolve, 300))
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          wishId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          status: "pending",
          duplicate: false,
          message: "Lời chúc đã được gửi và đang chờ duyệt.",
          requestId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        }),
      })
    })

    await page.goto("/e/public-event-1")
    await page.getByTestId("open-composer").click()
    await page.getByLabel("Nội dung lời chúc").fill("Chúc mừng tốt nghiệp!")
    await page.getByRole("button", { name: "Tiếp tục" }).click()
    await page.getByLabel("Tên hiển thị").fill("Playwright Guest")

    const submit = page.getByTestId("submit-wish")
    await expect(submit).toBeEnabled()
    await submit.dblclick()

    await expect(page.getByText("Lời chúc đang chờ duyệt")).toBeVisible()
    expect(requests).toBe(1)
  })

  test("keeps draft and request id after a retryable network error", async ({
    page,
  }) => {
    await installTurnstileMock(page)
    const requestIds: string[] = []
    let attempt = 0

    await page.route("**/functions/v1/submit-wish", async (route) => {
      attempt += 1
      const body = route.request().postDataJSON() as {
        clientRequestId: string
      }
      requestIds.push(body.clientRequestId)

      if (attempt === 1) {
        await route.abort("connectionfailed")
        return
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          wishId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          status: "approved",
          duplicate: true,
          message: "Lời chúc đã được hiển thị.",
          requestId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        }),
      })
    })

    await page.goto("/e/public-event-1")
    await page.getByTestId("open-composer").click()
    await page.getByLabel("Nội dung lời chúc").fill("Bản nháp cần được giữ")
    await page.getByRole("button", { name: "Tiếp tục" }).click()
    await page.getByLabel("Tên hiển thị").fill("Retry Guest")
    await page.getByTestId("submit-wish").click()

    await expect(
      page.getByText("Không thể kết nối. Bản nháp vẫn được giữ để bạn thử lại.")
    ).toBeVisible()
    await expect(page.getByText("Bản nháp cần được giữ")).toBeVisible()

    await expect(page.getByTestId("submit-wish")).toBeEnabled()
    await page.getByTestId("submit-wish").click()
    await expect(page.getByText("Lời chúc đã hiển thị")).toBeVisible()
    expect(requestIds).toHaveLength(2)
    expect(requestIds[1]).toBe(requestIds[0])
  })

  test("does not offer submission for a closed event", async ({ page }) => {
    await page.goto("/e/closed-event-1")

    await expect(page.getByTestId("composer-closed")).toBeVisible()
    await expect(page.getByTestId("open-composer")).toHaveCount(0)
  })
})
