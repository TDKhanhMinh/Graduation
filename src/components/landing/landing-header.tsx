"use client"

import { Menu, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import { MemoriaLogo } from "@/components/brand/memoria-logo"
import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/ui/page-shell"

const navigation = [
  ["Mẫu", "#template-showcase"],
  ["Cách hoạt động", "#product-story"],
  ["Tính năng", "#features"],
  ["FAQ", "#faq"],
] as const

export function LandingHeader({ authenticated }: { authenticated: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string>("#template-showcase")
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)

      // Section intersection detection
      const sections = navigation.map(([, href]) => href.substring(1))
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(`#${sectionId}`)
            break
          }
        }
      }
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const closeMenu = () => {
    setOpen(false)
    requestAnimationFrame(() => menuButtonRef.current?.focus())
  }

  return (
    <header className="sticky top-0 z-50 w-full px-4 pt-3 transition-all duration-300">
      <div
        className={`mx-auto max-w-5xl transition-all duration-500 ${
          scrolled
            ? "rounded-full border border-border/80 bg-background/80 p-2 shadow-lg shadow-primary/5 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70"
            : "rounded-2xl border border-transparent bg-transparent p-2"
        }`}
      >
        <PageShell className="flex h-12 items-center justify-between gap-4 px-3 sm:px-4">
          <Link
            href="/"
            aria-label="Memoria - Trang chủ"
            className="rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50 hover:opacity-90 transition-opacity"
          >
            <MemoriaLogo />
          </Link>

          <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 md:flex">
            {navigation.map(([label, href]) => {
              const isActive = activeSection === href
              return (
                <a
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-2 px-3 py-1.5 text-sm transition-all duration-200 ${
                    isActive
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-t-full bg-primary" aria-hidden="true" />
                  )}
                </a>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            {authenticated ? (
              <Link href="/dashboard">
                <Button variant="soft" className="min-h-10 rounded-full transition-transform active:scale-95">
                  Bảng điều khiển
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="hidden sm:block">
                  <Button variant="ghost" className="min-h-10 rounded-full text-muted-foreground hover:text-foreground">
                    Đăng nhập
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button className="min-h-10 rounded-full px-5 shadow-sm transition-all hover:scale-102 active:scale-98">
                    Tạo sự kiện
                  </Button>
                </Link>
              </>
            )}

            <Button
              ref={menuButtonRef}
              type="button"
              variant="outline"
              size="icon"
              className="min-h-10 min-w-10 rounded-full md:hidden"
              aria-label="Mở menu"
              aria-haspopup="dialog"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Menu aria-hidden="true" />
            </Button>
          </div>
        </PageShell>
      </div>

      <dialog
        ref={dialogRef}
        aria-label="Menu di động"
        onCancel={(event) => {
          event.preventDefault()
          closeMenu()
        }}
        onClose={() => setOpen(false)}
        className="m-0 ml-auto h-full max-h-none w-[min(22rem,92vw)] border-l border-border bg-background/95 p-0 text-foreground shadow-2xl backdrop-blur-2xl backdrop:bg-foreground/25 md:hidden"
      >
        <div className="flex h-full flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <MemoriaLogo />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="min-h-11 min-w-11 rounded-full"
              aria-label="Đóng menu"
              onClick={closeMenu}
            >
              <X aria-hidden="true" />
            </Button>
          </div>
          <nav aria-label="Điều hướng mobile" className="flex flex-col gap-2">
            {navigation.map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={closeMenu}
                className={`rounded-2xl px-4 py-3.5 text-base font-medium transition-all ${
                  activeSection === href ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"
                }`}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="mt-auto grid gap-3">
            <Link href={authenticated ? "/dashboard" : "/auth/sign-up"} onClick={closeMenu}>
              <Button className="min-h-11 w-full rounded-2xl">
                {authenticated ? "Mở bảng điều khiển" : "Tạo sự kiện miễn phí"}
              </Button>
            </Link>
            {!authenticated && (
              <Link href="/auth/login" onClick={closeMenu}>
                <Button variant="outline" className="min-h-11 w-full rounded-2xl">
                  Đăng nhập
                </Button>
              </Link>
            )}
          </div>
        </div>
      </dialog>
    </header>
  )
}
