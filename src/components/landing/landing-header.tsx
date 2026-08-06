"use client"

import { Menu, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import { MemoriaLogo } from "@/components/brand/memoria-logo"
import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/ui/page-shell"

const navigation = [["Cách hoạt động", "#how-it-works"], ["Mẫu giao diện", "#template-showcase"], ["Bức tường công khai", "#public-wall"], ["Tính năng", "#features"], ["FAQ", "#faq"]] as const

export function LandingHeader({ authenticated }: { authenticated: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
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

  const closeMenu = () => { setOpen(false); requestAnimationFrame(() => menuButtonRef.current?.focus()) }

  return <header className={`sticky inset-x-0 top-0 z-50 h-16 transition-[background-color,border-color,box-shadow,backdrop-filter] ${scrolled ? "border-b border-border/80 bg-background/85 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/75" : "border-b border-transparent bg-transparent"}`}><PageShell className="flex h-full items-center justify-between gap-4"><Link href="/" aria-label="Memoria - Trang chủ" className="rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50"><MemoriaLogo /></Link><nav aria-label="Điều hướng chính" className="hidden items-center gap-1 md:flex">{navigation.map(([label, href]) => <a key={href} href={href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/8 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50">{label}</a>)}</nav><div className="flex items-center gap-2">{authenticated ? <Link href="/dashboard"><Button variant="soft" className="min-h-11">Bảng điều khiển</Button></Link> : <><Link href="/auth/login" className="hidden sm:block"><Button variant="ghost" className="min-h-11">Đăng nhập</Button></Link><Link href="/auth/sign-up" className="hidden sm:block"><Button className="min-h-11">Tạo sự kiện miễn phí</Button></Link></>}<Button ref={menuButtonRef} type="button" variant="outline" size="icon" className="min-h-11 min-w-11 md:hidden" aria-label="Mở menu" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}><Menu aria-hidden="true" /></Button></div></PageShell><dialog ref={dialogRef} aria-label="Menu di động" onCancel={(event) => { event.preventDefault(); closeMenu() }} onClose={() => setOpen(false)} className="m-0 ml-auto h-full max-h-none w-[min(22rem,92vw)] border-l border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-foreground/25 md:hidden"><div className="flex h-full flex-col gap-6 p-6"><div className="flex items-center justify-between"><MemoriaLogo /><Button type="button" variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="Đóng menu" onClick={closeMenu}><X aria-hidden="true" /></Button></div><nav aria-label="Điều hướng mobile" className="flex flex-col gap-1">{navigation.map(([label, href]) => <a key={href} href={href} onClick={closeMenu} className="rounded-xl px-4 py-3 text-base font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50">{label}</a>)}</nav><div className="mt-auto grid gap-3"><Link href={authenticated ? "/dashboard" : "/auth/sign-up"} onClick={closeMenu}><Button className="min-h-11 w-full">{authenticated ? "Mở bảng điều khiển" : "Tạo sự kiện miễn phí"}</Button></Link>{!authenticated ? <Link href="/auth/login" onClick={closeMenu}><Button variant="outline" className="min-h-11 w-full">Đăng nhập</Button></Link> : null}</div></div></dialog></header>
}
