import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { Toaster } from "@/components/ui/sonner"
import { getSiteUrl } from "@/lib/supabase/env"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = { metadataBase: new URL(getSiteUrl()), title: "Memoria", description: "Memoria — poster, QR, lời chúc và Public Wall cho những sự kiện đáng nhớ." }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}><body className="flex min-h-full flex-col"><a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-background focus:px-4 focus:py-3 focus:text-sm focus:font-medium focus:text-foreground focus:ring-3 focus:ring-focus/50">Bỏ qua đến nội dung chính</a>{children}<Toaster position="bottom-right" /></body></html>
}
