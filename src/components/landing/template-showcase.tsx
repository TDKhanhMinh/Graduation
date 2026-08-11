"use client"

import { useEffect, useRef, useState } from "react"
import { Layers } from "lucide-react"

import { PosterPlayground } from "@/components/landing/poster-playground"
import { TemplateCard } from "@/components/landing/template-card"
import { localPosterTemplates } from "@/features/posters/templates"
import { filterPosterTemplateLibrary } from "@/features/posters/template-library"
import type { PosterEventCategory, PosterTemplate } from "@/features/posters/schema"

const filters = [
  ["all", "Tất cả mẫu"],
  ["wedding", "Đám cưới"],
  ["birthday", "Sinh nhật"],
  ["graduation", "Tốt nghiệp"],
  ["corporate", "Doanh nghiệp"],
  ["general", "Tối giản"],
] as const

export function TemplateShowcase() {
  const [filter, setFilter] = useState<(typeof filters)[number][0]>("all")
  const [selected, setSelected] = useState<PosterTemplate | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const templates =
    filter === "all"
      ? localPosterTemplates
      : filterPosterTemplateLibrary(localPosterTemplates, { category: filter as PosterEventCategory })

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (selected && !dialog.open) dialog.showModal()
    if (!selected && dialog.open) dialog.close()
  }, [selected])

  const close = () => {
    setSelected(null)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }

  return (
    <section id="template-showcase" className="scroll-mt-24 border-t bg-background py-16 sm:py-24 lg:py-32">
      <div className="mx-auto w-full max-w-(--content-max-width) px-(--page-gutter)">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <Layers className="size-3.5" /> Infinite Poster Gallery
          </div>
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Bắt đầu bằng một áp phích đúng với sự kiện của bạn
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Mỗi mẫu áp phích là một không gian thiết kế độc bản. Lựa chọn, tùy chỉnh màu sắc và tạo dấu ấn cho bữa tiệc trong vài giây.
          </p>

          {/* Filter Pills */}
          <div role="tablist" aria-label="Lọc mẫu" className="mt-8 flex flex-wrap justify-center gap-2">
            {filters.map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={filter === value}
                onClick={() => setFilter(value)}
                className={`min-h-11 rounded-full border px-5 text-sm font-medium transition-all ${
                  filter === value
                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                    : "border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid with Depth & Overlap */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {templates.map((template, idx) => (
            <TemplateCard
              key={template.id}
              template={template}
              index={idx}
              onPreview={(next, trigger) => {
                triggerRef.current = trigger
                setSelected(next)
              }}
            />
          ))}
        </div>

        {templates.length === 0 && (
          <p className="mt-12 rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            Chưa có mẫu áp phích trong nhóm này.
          </p>
        )}
      </div>

      {/* Preview Dialog */}
      <dialog
        ref={dialogRef}
        aria-labelledby="template-preview-title"
        onCancel={(event) => {
          event.preventDefault()
          close()
        }}
        onClose={() => setSelected(null)}
        className="m-auto max-h-[92vh] w-[min(64rem,94vw)] overflow-y-auto rounded-3xl border bg-background p-0 text-foreground shadow-2xl backdrop:bg-foreground/30"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 border-b pb-4">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Xưởng Thiết Kế Áp Phích</p>
              <h3 id="template-preview-title" className="mt-1 font-heading text-2xl font-bold">
                {selected?.name}
              </h3>
            </div>
            <button
              type="button"
              onClick={close}
              className="min-h-10 rounded-full border px-5 text-sm font-medium hover:bg-muted focus-visible:outline-none"
            >
              Đóng xem trước
            </button>
          </div>
          {selected && (
            <div className="mt-6">
              <PosterPlayground template={selected} />
            </div>
          )}
        </div>
      </dialog>
    </section>
  )
}
