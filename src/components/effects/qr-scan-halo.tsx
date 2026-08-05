import { cn } from "@/lib/utils"

export function QrScanHalo({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("pointer-events-none absolute inset-1 rounded-lg", className)}>
      <span className="qr-halo-corner qr-halo-corner-top-left" />
      <span className="qr-halo-corner qr-halo-corner-top-right" />
      <span className="qr-halo-corner qr-halo-corner-bottom-left" />
      <span className="qr-halo-corner qr-halo-corner-bottom-right" />
      <span className="qr-scan-line" />
    </span>
  )
}
