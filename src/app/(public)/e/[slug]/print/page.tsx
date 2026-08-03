import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPrintableEventSnapshot } from "@/features/exports/dal"
import { PrintControls } from "@/components/export/PrintControls"
import { PrintableWishList } from "@/components/export/PrintableWishList"

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export const metadata: Metadata = {
  title: "In danh sách lời chúc",
  robots: {
    index: false, // Do not index the print page
    follow: false,
  },
}

export default async function PrintEventPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { token } = await searchParams
  
  const tokenString = Array.isArray(token) ? token[0] : token

  const snapshot = await getPrintableEventSnapshot(slug, tokenString)

  if (!snapshot) {
    // Return 404 if not found or unauthorized
    notFound()
  }

  const { event, wishes } = snapshot

  return (
    <div className="min-h-screen bg-white">
      {/* 
        Inject specific print styles globally for this page.
        This ensures margins, hidden elements, and background colors are handled properly in print dialog.
      */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 1cm; }
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
            background: white !important;
          }
        }
      ` }} />

      <PrintControls />

      <div className="max-w-4xl mx-auto px-8 py-10 print:py-0 print:px-0">
        <header className="text-center mb-10 pb-6 border-b-2 border-primary/20 break-inside-avoid">
          <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
          {event.description && (
            <p className="text-muted-foreground text-lg mb-4">{event.description}</p>
          )}
          <div className="text-sm text-muted-foreground uppercase tracking-widest mt-2 border-t pt-4 inline-block">
            Sổ lưu bút sự kiện • Tổng cộng {wishes.length} lời chúc
          </div>
        </header>

        <main>
          <PrintableWishList wishes={wishes} />
        </main>

        {wishes.length > 0 && (
          <footer className="mt-10 pt-6 border-t text-center text-sm text-muted-foreground break-inside-avoid">
            <p>Được tạo tự động từ Graduation Message.</p>
          </footer>
        )}
      </div>
    </div>
  )
}
