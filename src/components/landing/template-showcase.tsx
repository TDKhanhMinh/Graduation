"use client"

import { useEffect, useRef, useState } from "react"

import { PosterPlayground } from "@/components/landing/poster-playground"
import { TemplateCard } from "@/components/landing/template-card"
import { localPosterTemplates } from "@/features/posters/templates"
import { filterPosterTemplateLibrary } from "@/features/posters/template-library"
import type { PosterEventCategory, PosterTemplate } from "@/features/posters/schema"

const filters = [["all", "Tất cả"], ["wedding", "Đám cưới"], ["birthday", "Sinh nhật"], ["graduation", "Tốt nghiệp"], ["corporate", "Doanh nghiệp"], ["general", "Tối giản"]] as const

export function TemplateShowcase() {
  const [filter, setFilter] = useState<(typeof filters)[number][0]>("all")
  const [selected, setSelected] = useState<PosterTemplate | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const templates = filter === "all" ? localPosterTemplates : filterPosterTemplateLibrary(localPosterTemplates, { category: filter as PosterEventCategory })

  useEffect(() => { const dialog = dialogRef.current; if (!dialog) return; if (selected && !dialog.open) dialog.showModal(); if (!selected && dialog.open) dialog.close() }, [selected])
  const close = () => { setSelected(null); requestAnimationFrame(() => triggerRef.current?.focus()) }

  return <section id="template-showcase" className="scroll-mt-24 border-t bg-background py-16 sm:py-24 lg:py-32"><div className="mx-auto w-full max-w-(--content-max-width) px-(--page-gutter)"><div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Mẫu giao diện</p><h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Bắt đầu bằng một áp phích đúng với dịp của bạn</h2><p className="mt-4 text-base leading-7 text-muted-foreground">Lọc, xem trước và thử một vài thay đổi trong bản minh họa có kiểm soát.</p></div><div role="tablist" aria-label="Lọc mẫu" className="mt-8 flex gap-2 overflow-x-auto pb-2">{filters.map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={filter === value} onClick={() => setFilter(value)} className="min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium aria-selected:border-primary aria-selected:bg-primary/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50">{label}</button>)}</div><div className="mt-8 grid gap-5 md:grid-cols-3 lg:grid-cols-4">{templates.map((template) => <TemplateCard key={template.id} template={template} onPreview={(next, trigger) => { triggerRef.current = trigger; setSelected(next) }} />)}</div>{templates.length === 0 ? <p className="mt-8 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Chưa có mẫu trong nhóm này.</p> : null}</div><dialog ref={dialogRef} aria-labelledby="template-preview-title" onCancel={(event) => { event.preventDefault(); close() }} onClose={() => setSelected(null)} className="m-auto max-h-[92vh] w-[min(64rem,94vw)] overflow-y-auto rounded-3xl border bg-background p-0 text-foreground shadow-2xl backdrop:bg-foreground/30"><div className="p-5 sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-primary">Xem trước Tương tác</p><h3 id="template-preview-title" className="mt-1 font-heading text-2xl font-bold">{selected?.name}</h3></div><button type="button" onClick={close} className="min-h-11 rounded-lg border px-4 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50">Đóng</button></div>{selected ? <div className="mt-6"><PosterPlayground template={selected} /></div> : null}</div></dialog></section>
}
