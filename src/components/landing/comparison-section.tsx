import { Check, X, Sparkles } from "lucide-react"

import { LandingSection } from "@/components/landing/landing-section"
import { PageShell } from "@/components/ui/page-shell"

const featureMatrix = [
  { feature: "Thiết kế áp phích sự kiện chuyên nghiệp", memoria: true, qrAlbum: false, drive: false },
  { feature: "Quét QR để tham gia, không cần tải app", memoria: true, qrAlbum: true, drive: false },
  { feature: "Trình chiếu Public Wall trực tiếp tại sự kiện", memoria: true, qrAlbum: false, drive: false },
  { feature: "Kiểm duyệt nội dung trước khi phát sóng", memoria: true, qrAlbum: false, drive: false },
  { feature: "Tự động lưu trữ thành Album kỷ niệm", memoria: true, qrAlbum: true, drive: true },
]

export function ComparisonSection() {
  return (
    <LandingSection id="comparison" className="scroll-mt-20 border-t bg-surface-sunken py-16 sm:py-24 lg:py-32">
      <PageShell>
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="size-3.5" /> Value Proposition
          </div>
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Một QR có thể làm nhiều hơn bạn nghĩ
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Memoria kết nối thiết kế áp phích, mã QR tương tác và màn hình trình chiếu trong một hệ sinh thái duy nhất.
          </p>
        </div>

        {/* Feature Comparison Matrix Table */}
        <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-xl">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] border-b bg-muted/60 p-4 sm:p-6 text-xs sm:text-sm font-bold text-foreground">
            <span>Tính năng trải nghiệm</span>
            <span className="text-primary text-center flex items-center justify-center gap-1">
              Memoria ✨
            </span>
            <span className="text-center text-muted-foreground">Album QR</span>
            <span className="text-center text-muted-foreground">Google Drive</span>
          </div>

          <div className="divide-y divide-border">
            {featureMatrix.map((item) => (
              <div key={item.feature} className="grid grid-cols-[1.5fr_1fr_1fr_1fr] items-center p-4 sm:p-5 text-xs sm:text-sm font-medium hover:bg-muted/30 transition-colors">
                <span className="text-foreground">{item.feature}</span>

                <span className="flex justify-center text-status-success font-bold">
                  {item.memoria ? <Check className="size-5 text-primary stroke-[3]" /> : <X className="size-4 text-muted-foreground/40" />}
                </span>

                <span className="flex justify-center text-muted-foreground">
                  {item.qrAlbum ? <Check className="size-4 text-status-success" /> : <X className="size-4 text-muted-foreground/40" />}
                </span>

                <span className="flex justify-center text-muted-foreground">
                  {item.drive ? <Check className="size-4 text-status-success" /> : <X className="size-4 text-muted-foreground/40" />}
                </span>
              </div>
            ))}
          </div>
        </div>
      </PageShell>
    </LandingSection>
  )
}
