'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteEvent } from '@/features/events/actions'

export function DeleteEventControl({
  eventId,
  eventTitle,
}: {
  eventId: string
  eventTitle: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)

  const executeDelete = () => {
    startTransition(async () => {
      try {
        await deleteEvent(eventId)
        setShowConfirm(false)
        toast.success('Đã xóa sự kiện. Sự kiện đã được ẩn khỏi các luồng truy cập.')
        router.push('/dashboard')
        router.refresh()
      } catch (error) {
        console.error(error)
        toast.error('Không thể xóa sự kiện. Vui lòng thử lại.')
      }
    })
  }

  return (
    <>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='min-w-0'>
          <h3 className='font-medium text-status-danger'>Xóa sự kiện</h3>
          <p className='mt-1 text-sm leading-6 text-muted-foreground'>
            Sự kiện sẽ bị ẩn khỏi dashboard, trang công khai và không nhận lời chúc mới. Dữ liệu được giữ lại theo chính sách lưu trữ.
          </p>
        </div>
        <Button
          type='button'
          variant='destructive'
          onClick={() => setShowConfirm(true)}
          disabled={isPending}
          aria-busy={isPending}
          aria-label={isPending ? 'Đang xóa sự kiện' : 'Xóa sự kiện'}
          className='min-h-(--control-min-size) shrink-0'
        >
          {isPending ? 'Đang xóa...' : 'Xóa sự kiện'}
        </Button>
        <span className='sr-only' role='status' aria-live='polite'>
          {isPending ? 'Đang xử lý xóa sự kiện' : ''}
        </span>
      </div>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        variant="danger"
        title={`Xác nhận xóa sự kiện "${eventTitle}"?`}
        description="Sự kiện sẽ bị ẩn khỏi bảng điều khiển và trang công khai; dữ liệu không bị xóa vật lý ngay lập tức và có thể khôi phục theo chính sách lưu giữ."
        confirmText="Xóa sự kiện"
        cancelText="Hủy bỏ"
        isPending={isPending}
        onConfirm={executeDelete}
      />
    </>
  )
}

