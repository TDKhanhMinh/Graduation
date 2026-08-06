"use client"

import { useEffect } from "react"

import { track } from "@/lib/analytics/events"

export function LandingAnalytics() {
  useEffect(() => {
    track("landing_visit", { source: "landing", variant: "poster-first" }, { dedupeKey: "landing" })
    const seen = new Set<string>()
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null
      if (!target) return
      const link = target.closest("a")
      const text = (target.closest("button,summary,a")?.textContent ?? "").trim().toLowerCase()
      if (link?.getAttribute("href")?.startsWith("#template-showcase")) track("sample_event_clicked", { source: "landing" })
      if (link?.getAttribute("href") === "/auth/sign-up" || link?.getAttribute("href") === "/dashboard") track("cta_click", { placement: target.closest("header") ? "header" : "content" })
      if (target.closest("#template-showcase")) {
        track("poster_demo_interaction", { control: target.closest("input,select")?.tagName.toLowerCase() ?? "button" })
        if (text.includes("preview")) { track("template_selected", { source: "showcase" }); track("template_previewed", { source: "showcase" }) }
        if (link?.getAttribute("href") === "/auth/sign-up") track("template_continue", { source: "showcase" })
      }
      if (target.closest("#faq summary")) track("faq_opened", { source: "landing" })
    }
    document.addEventListener("click", onClick, true)
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { const id = entry.target instanceof HTMLElement ? entry.target.id : ""; if (entry.isIntersecting && id && !seen.has(id)) { seen.add(id); track("section_reached", { section: id }, { dedupeKey: id }) } }), { threshold: 0.25 })
    document.querySelectorAll("main section[id]").forEach((section) => observer.observe(section))
    return () => { document.removeEventListener("click", onClick, true); observer.disconnect() }
  }, [])
  return null
}
