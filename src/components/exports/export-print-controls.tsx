"use client"

import { ArrowLeft, Printer } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export function ExportPrintControls({ backHref }: { backHref: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-3 print:hidden">
      <Link
        href={backHref}
        className="inline-flex min-h-(--control-min-size) items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Quay lại Export Center
      </Link>
      <Button type="button" onClick={() => window.print()}>
        <Printer aria-hidden="true" />
        In hoặc lưu PDF
      </Button>
    </div>
  )
}
