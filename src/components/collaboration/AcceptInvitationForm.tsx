'use client'

import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

export function AcceptInvitationForm({ invitationId, token }: { invitationId: string; token: string }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function accept() {
    setSubmitting(true)
    try {
      const result = await fetch(`/api/collaborators/invites/${invitationId}/accept`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }),
      })
      const body = await result.json()
      if (!result.ok) throw new Error(body.error ?? 'Không thể nhận lời mời.')
      toast.success('Đã nhận lời mời cộng tác viên.')
      router.push(`/dashboard/events/${body.event_id}`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể nhận lời mời.')
    } finally {
      setSubmitting(false)
    }
  }

  return <Button type='button' onClick={() => void accept()} disabled={submitting} className='min-h-(--control-min-size) w-full'><CheckCircle2 aria-hidden='true' />{submitting ? 'Đang xác nhận...' : 'Nhận lời mời'}</Button>
}
