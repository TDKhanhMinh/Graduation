import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { WallLayer, WallStage } from "./wall-stage"

describe("WallStage", () => {
  it("exposes explicit layer order without blocking content", () => {
    render(
      <WallStage layout="spotlight" aspect="portrait">
        <WallLayer name="ambient"><div>ambient</div></WallLayer>
        <WallLayer name="content"><button type="button">React</button></WallLayer>
        <WallLayer name="effects"><div>effects</div></WallLayer>
      </WallStage>,
    )

    const stage = screen.getByRole("button", { name: "React" }).closest("[data-wall-stage]")
    expect(stage).toHaveAttribute("data-wall-layout", "spotlight")
    expect(stage).toHaveAttribute("data-wall-aspect", "portrait")
    expect(screen.getByText("ambient").parentElement).toHaveAttribute("data-wall-layer", "ambient")
    expect(screen.getByText("effects").parentElement).toHaveClass("pointer-events-none")
  })
})
