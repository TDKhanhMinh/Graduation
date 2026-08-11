"use client"

import { motion } from "framer-motion"
import { Eye, QrCode } from "lucide-react"
import type { PosterTemplate } from "@/features/posters/schema"

const categoryLabels: Record<string, string> = {
  wedding: "Đám cưới",
  birthday: "Sinh nhật",
  graduation: "Tốt nghiệp",
  corporate: "Doanh nghiệp",
  general: "Tối giản",
}

// Pre-calculated angles for natural poster gallery look
const rotations = [-2.5, 1.8, -1.2, 2.2, -1.5, 2.8, -2.0, 1.5]

export function TemplateCard({
  template,
  index = 0,
  onPreview,
}: {
  template: PosterTemplate
  index?: number
  onPreview: (template: PosterTemplate, trigger: HTMLButtonElement) => void
}) {
  const palette = template.palette
  const rotation = rotations[index % rotations.length]

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ scale: 1.04, rotate: 0, zIndex: 10 }}
      style={{ rotate: `${rotation}deg` }}
      className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-3.5 shadow-md transition-all duration-300 hover:shadow-2xl hover:border-primary/30"
    >
      {/* Poster Canvas Visual */}
      <div
        className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl p-5 text-white shadow-inner flex flex-col justify-between"
        style={{ background: `linear-gradient(145deg, ${palette[0]}, ${palette[1]})` }}
      >
        <div className="flex justify-between items-start">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/80">{template.name}</p>
          <div className="rounded-lg bg-white/90 p-1.5 text-foreground shadow-sm">
            <QrCode className="size-5" />
          </div>
        </div>

        <div>
          <p className="font-heading text-xl font-bold tracking-tight">Kỷ Niệm Ngày Chung Đôi</p>
          <p className="text-[11px] text-white/70 mt-1">24.10.2026 · Hà Nội</p>
        </div>

        {/* Hover Glass Overlay */}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-xs opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center p-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg">
            <Eye className="size-4" /> Xem trước chi tiết
          </span>
        </div>
      </div>

      {/* Card Info Footer */}
      <div className="mt-3 space-y-2 px-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="min-w-0 truncate font-heading text-base font-bold">{template.name}</h3>
          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            {categoryLabels[template.categories[0]] || "Mẫu mới"}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5" aria-label={`Bảng màu của ${template.name}`}>
            {palette.slice(0, 4).map((color) => (
              <span key={color} className="size-4 rounded-full border border-border/80 shadow-2xs" style={{ backgroundColor: color }} />
            ))}
          </div>

          <button
            type="button"
            onClick={(event) => onPreview(template, event.currentTarget)}
            className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none"
          >
            Thử mẫu này →
          </button>
        </div>
      </div>
    </motion.article>
  )
}
