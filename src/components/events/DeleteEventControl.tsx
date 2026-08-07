'use client'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
  const handleDelete = () => {
    if (
      !window.confirm(
        '\u0042\u1ea1n c\u00f3 ch\u1eafc mu\u1ed1n x\u00f3a s\u1ef1 ki\u1ec7n \u0022' +
          eventTitle +
          '\u0022? S\u1ef1 ki\u1ec7n s\u1ebd b\u1ecb \u1ea9n kh\u1ecfi dashboard v\u00e0 trang c\u00f4ng khai; d\u1eef li\u1ec7u kh\u00f4ng b\u1ecb x\u00f3a v\u1eadt l\u00fd ngay l\u1eadp t\u1ee9c.'
      )
    ) {
      return
    }
    startTransition(async () => {
      try {
        await deleteEvent(eventId)
        toast.success('\u0110\u00e3 x\u00f3a s\u1ef1 ki\u1ec7n. S\u1ef1 ki\u1ec7n \u0111\u00e3 \u0111\u01b0\u1ee3c \u1ea9n kh\u1ecfi c\u00e1c lu\u1ed3ng truy c\u1eadp.')
        router.push('/dashboard')
        router.refresh()
      } catch (error) {
        console.error(error)
        toast.error('Kh\u00f4ng th\u1ec3 x\u00f3a s\u1ef1 ki\u1ec7n. Vui l\u00f2ng th\u1eed l\u1ea1i.')
      }
    })
  }
  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
      <div className='min-w-0'>
        <h3 className='font-medium text-status-danger'>{'\u0058\u00f3a s\u1ef1 ki\u1ec7n'}</h3>
        <p className='mt-1 text-sm leading-6 text-muted-foreground'>
          {'S\u1ef1 ki\u1ec7n s\u1ebd b\u1ecb \u1ea9n kh\u1ecfi dashboard, trang c\u00f4ng khai v\u00e0 kh\u00f4ng nh\u1eadn l\u1eddi ch\u00fac m\u1edbi. D\u1eef li\u1ec7u \u0111\u01b0\u1ee3c gi\u1eef l\u1ea1i theo ch\u00ednh s\u00e1ch l\u01b0u tr\u1eef.'}
        </p>
      </div>
      <Button
        type='button'
        variant='destructive'
        onClick={handleDelete}
        disabled={isPending}
        aria-busy={isPending}
        aria-label={isPending ? '\u0110ang x\u00f3a s\u1ef1 ki\u1ec7n' : '\u0058\u00f3a s\u1ef1 ki\u1ec7n'}
        className='min-h-(--control-min-size) shrink-0'
      >
        {isPending ? '\u0110ang x\u00f3a...' : '\u0058\u00f3a s\u1ef1 ki\u1ec7n'}
      </Button>
      <span className='sr-only' role='status' aria-live='polite'>
        {isPending ? '\u0110ang x\u1eed l\u00fd x\u00f3a s\u1ef1 ki\u1ec7n' : ''}
      </span>
    </div>
  )
}
