import { fireEvent, render, screen } from "@testing-library/react"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"

import { WishComposer } from "./WishComposer"

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "")
  }
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open")
    this.dispatchEvent(new Event("close"))
  }
  window.requestAnimationFrame = (callback) => {
    callback(0)
    return 0
  }
})

beforeEach(() => {
  window.localStorage.clear()
})

describe("WishComposer", () => {
  it("supports the keyboard-friendly two-step flow and event counter", async () => {
    render(
      <WishComposer
        eventId="e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e01"
        eventTitle="Lễ tốt nghiệp"
        maxLength={120}
        submissionMode="approval_required"
        turnstileSiteKey=""
      />
    )

    const openButton = await screen.findByTestId("open-composer")
    fireEvent.click(openButton)

    const content = screen.getByLabelText("Nội dung lời chúc")
    fireEvent.change(content, { target: { value: "Chúc mừng tốt nghiệp!" } })
    expect(screen.getByText("21/120")).toBeVisible()

    fireEvent.submit(content.closest("form")!)
    expect(screen.getByLabelText("Tên hiển thị")).toBeVisible()
    expect(screen.getByText("Chúc mừng tốt nghiệp!")).toBeVisible()
    expect(
      screen.getByText("CAPTCHA chưa được cấu hình. Vui lòng thử lại sau.")
    ).toHaveAttribute("role", "alert")
  })

  it("renders a non-interactive closed-event state", () => {
    render(
      <WishComposer
        eventId="event"
        eventTitle="Closed"
        maxLength={1000}
        submissionMode="closed"
        turnstileSiteKey=""
      />
    )

    expect(screen.getByTestId("composer-closed")).toBeVisible()
    expect(screen.queryByTestId("open-composer")).not.toBeInTheDocument()
  })
})
