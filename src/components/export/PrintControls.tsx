"use client"

import { useEffect, useState } from "react"
import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PrintControls() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Wait a bit for images to load, or wait for window.onload
    // A simple approach is to check if document is complete
    const checkReady = () => {
      if (document.readyState === "complete") {
        setIsReady(true)
      }
    }

    if (document.readyState === "complete") {
      // In some cases (e.g. Next.js navigation), it might already be complete
      // Give a small delay for lazy loaded images to start fetching
      const timer = setTimeout(() => {
        setIsReady(true)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      window.addEventListener("load", checkReady)
      return () => window.removeEventListener("load", checkReady)
    }
  }, [])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden flex flex-col gap-2 items-end">
      {!isReady && (
        <div className="bg-primary-foreground text-primary text-xs px-3 py-1 rounded-full shadow-sm animate-pulse border">
          Đang tải nội dung in...
        </div>
      )}
      <Button 
        onClick={handlePrint} 
        disabled={!isReady}
        size="lg"
        className="rounded-full shadow-lg"
      >
        <Printer className="mr-2 h-5 w-5" />
        In hoặc lưu PDF
      </Button>
    </div>
  )
}
