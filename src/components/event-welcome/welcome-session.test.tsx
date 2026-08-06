import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { WelcomeSession } from "./welcome-session"

describe("WelcomeSession", () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    window.history.replaceState({}, "", "/e/test")
    HTMLElement.prototype.scrollIntoView = vi.fn()
    window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })
  })

  it("distinguishes first and repeat visits using sessionStorage only", async () => {
    const first = render(
      <WelcomeSession slug="event-a">
        <section data-testid="welcome-content" />
      </WelcomeSession>,
    )

    await waitFor(() => expect(first.getByTestId("welcome-content").parentElement).toHaveAttribute("data-welcome-visit", "first"))
    first.unmount()

    render(
      <WelcomeSession slug="event-a">
        <section data-testid="welcome-content" />
      </WelcomeSession>,
    )

    await waitFor(() => expect(screen.getByTestId("welcome-content").parentElement).toHaveAttribute("data-welcome-visit", "repeat"))
    expect(window.localStorage.getItem("event-welcomed:event-a")).toBeNull()
  })

  it("focuses the deep-link target while preserving the native anchor fallback", async () => {
    window.history.replaceState({}, "", "/e/test?action=wish")
    render(
      <WelcomeSession slug="event-a">
        <section id="submit-wish">
          <button data-testid="open-composer" type="button">Open</button>
        </section>
      </WelcomeSession>,
    )

    await waitFor(() => expect(screen.getByTestId("open-composer")).toHaveFocus())
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" })
  })

  it("renders without an animation gate when storage is unavailable", async () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage blocked")
    })

    render(
      <WelcomeSession slug="event-a">
        <section data-testid="welcome-content" />
      </WelcomeSession>,
    )

    await waitFor(() => expect(screen.getByTestId("welcome-content").parentElement).toHaveAttribute("data-welcome-visit", "storage-unavailable"))
    getItem.mockRestore()
  })

  it("marks the motion timeline as reduced when the preference is enabled", async () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    render(
      <WelcomeSession slug="event-a">
        <section data-testid="welcome-content" />
      </WelcomeSession>,
    )

    await waitFor(() => expect(screen.getByTestId("welcome-content").parentElement).toHaveAttribute("data-welcome-motion", "reduced"))
  })
})
