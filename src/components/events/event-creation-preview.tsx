import { CalendarDays, Heart, QrCode, Sparkles } from "lucide-react"

export function EventCreationPreview() {
  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start" aria-labelledby="event-preview-title">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Live preview</p>
        <h2 id="event-preview-title" className="mt-1 font-heading text-lg font-semibold">Không gian sau khi tạo</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Nội dung thật sẽ được hiển thị trên trang sự kiện của bạn.</p>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-primary/15 bg-card shadow-[0_24px_60px_-38px_var(--brand-700)]">
        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_80%_10%,var(--memory-peach)_0,transparent_32%),linear-gradient(145deg,var(--brand-50),var(--background)_70%)] p-5">
          <div className="absolute -right-5 -top-5 size-20 rounded-full border border-memory-pink/30" />
          <div className="relative">
            <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Memoria</span><Sparkles className="size-4 text-primary" /></div>
            <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/75">Your event title</p>
            <p className="mt-2 font-heading text-2xl font-semibold tracking-tight">Một ngày thật đẹp</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Lời chào và mô tả của bạn sẽ xuất hiện ở đây.</p>
            <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="size-3.5" />Ngày sự kiện</div>
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-xl border bg-background p-3"><div className="flex items-center gap-2 text-sm font-medium"><Heart className="size-4 fill-memory-pink text-memory-pink" />Gửi lời chúc</div><p className="mt-2 text-xs leading-5 text-muted-foreground">Khách mời có thể tham gia bằng QR hoặc đường dẫn.</p></div>
          <div className="rounded-xl border bg-background p-3"><div className="flex items-center gap-2 text-sm font-medium"><QrCode className="size-4 text-primary" />Chia sẻ dễ dàng</div><p className="mt-2 text-xs leading-5 text-muted-foreground">QR sẽ có trong khu vực chia sẻ sau khi tạo.</p></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2" aria-label="Các theme có sẵn trong appearance editor">
        <div className="rounded-xl border border-primary bg-[var(--brand-50)] p-2 text-center text-[10px] font-medium text-primary ring-2 ring-primary/10">Graduation</div>
        <div className="rounded-xl border bg-amber-50 p-2 text-center text-[10px] font-medium text-amber-800">Editorial</div>
        <div className="rounded-xl border bg-slate-50 p-2 text-center text-[10px] font-medium text-slate-700">Minimal</div>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">Bạn có thể chọn theme và cover trong Appearance sau khi tạo event.</p>
    </aside>
  )
}