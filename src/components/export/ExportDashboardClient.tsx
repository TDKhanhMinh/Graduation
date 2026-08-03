"use client"

import { useState, useEffect, useRef } from "react"
import { Printer, Download, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type Props = {
  eventId: string
  slug: string
}

type JobStatus = 'queued' | 'processing' | 'completed' | 'failed'

export function ExportDashboardClient({ eventId, slug }: Props) {
  const [isCreating, setIsCreating] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [])

  // Poll status when jobId exists and status is pending
  useEffect(() => {
    if (jobId && (jobStatus === 'queued' || jobStatus === 'processing')) {
      const poll = async () => {
        try {
          const res = await fetch(`/api/exports/${jobId}`)
          if (!res.ok) {
            throw new Error('Failed to fetch job status')
          }
          const data = await res.json()
          
          setJobStatus(data.status)
          if (data.status === 'completed' && data.downloadUrl) {
            setDownloadUrl(data.downloadUrl)
          }
          if (data.status === 'failed') {
            setError("Quá trình xuất PDF gặp lỗi. Vui lòng thử lại.")
          }
        } catch (err) {
          console.error("Polling error:", err)
        }
      }

      pollIntervalRef.current = setInterval(poll, 3000)
      return () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      }
    }
  }, [jobId, jobStatus])

  const handleCreateJob = async () => {
    setIsCreating(true)
    setError(null)
    setJobId(null)
    setJobStatus(null)
    setDownloadUrl(null)

    try {
      const res = await fetch('/api/exports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          slug,
          idempotencyKey: `${eventId}-${Date.now()}` // Basic idempotency for UI
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create export job')
      }

      setJobId(data.jobId)
      setJobStatus(data.status)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsCreating(false)
    }
  }

  const handleBrowserPrint = () => {
    window.open(`/e/${slug}/print`, '_blank')
  }

  const handleRefreshUrl = async () => {
    if (!jobId) return
    setIsCreating(true) // Reuse loading state for UI feedback
    try {
      const res = await fetch(`/api/exports/${jobId}`)
      if (!res.ok) throw new Error('Failed to fetch job status')
      const data = await res.json()
      if (data.downloadUrl) {
        setDownloadUrl(data.downloadUrl)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>In trực tiếp qua Trình duyệt</CardTitle>
          <CardDescription>
            Mở giao diện tối ưu cho máy in, bạn có thể sử dụng chức năng Print của Chrome/Safari (Ctrl+P / Cmd+P) để in hoặc lưu thành file PDF thủ công.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Khuyên dùng cho các sự kiện nhỏ (dưới 100 lời chúc). Nếu sự kiện có quá nhiều lời chúc, trình duyệt có thể bị đứng hoặc thiếu bộ nhớ.
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={handleBrowserPrint} className="w-full">
            <Printer className="mr-2 h-4 w-4" />
            Mở trang In
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Xuất PDF Tự động</CardTitle>
          <CardDescription>
            Hệ thống sẽ tổng hợp lời chúc và tạo file PDF chạy ngầm. Phù hợp cho sự kiện lớn, kết quả có thể mất vài phút.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Lỗi</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!jobId && !error && (
            <div className="text-sm text-muted-foreground">
              Chưa có tiến trình nào đang chạy. Nhấn nút bên dưới để bắt đầu.
            </div>
          )}

          {jobId && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Trạng thái:</span>
                {jobStatus === 'queued' && (
                  <span className="flex items-center text-sm text-blue-600">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang đợi xử lý...
                  </span>
                )}
                {jobStatus === 'processing' && (
                  <span className="flex items-center text-sm text-amber-600">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tạo PDF...
                  </span>
                )}
                {jobStatus === 'completed' && (
                  <span className="flex items-center text-sm text-green-600 font-semibold">
                    Hoàn tất!
                  </span>
                )}
                {jobStatus === 'failed' && (
                  <span className="flex items-center text-sm text-red-600">
                    Thất bại
                  </span>
                )}
              </div>
              
              {jobStatus === 'completed' && downloadUrl && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  File PDF đã sẵn sàng. Liên kết tải xuống sẽ hết hạn sau 15 phút.
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {(!jobId || jobStatus === 'failed') && (
            <Button 
              onClick={handleCreateJob} 
              disabled={isCreating} 
              className="w-full"
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {jobStatus === 'failed' ? "Thử lại" : "Bắt đầu tạo PDF"}
            </Button>
          )}

          {jobStatus === 'completed' && downloadUrl && (
            <>
              <Button 
                className="w-full" 
                variant="default"
                onClick={() => window.open(downloadUrl, '_blank')}
              >
                <Download className="mr-2 h-4 w-4" />
                Tải xuống PDF
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRefreshUrl} disabled={isCreating} className="w-full text-xs">
                <RefreshCw className={`mr-2 h-3 w-3 ${isCreating ? 'animate-spin' : ''}`} />
                Làm mới liên kết nếu đã hết hạn
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
