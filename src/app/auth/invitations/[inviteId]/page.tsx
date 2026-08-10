import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AcceptInvitationForm } from '@/components/collaboration/AcceptInvitationForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { verifySession } from '@/lib/auth/dal'

export default async function InvitationPage({ params, searchParams }: { params: Promise<{ inviteId: string }>; searchParams: Promise<{ token?: string }> }) {
  const { inviteId } = await params
  const { token } = await searchParams
  if (!token) notFound()
  const session = await verifySession()

  return (
    <main className='mx-auto flex min-h-dvh max-w-lg items-center px-4 py-10'>
      <Card className='w-full'>
        <CardHeader><CardTitle>Lời mời cộng tác viên</CardTitle><CardDescription>{session ? 'Xác nhận để thêm quyền truy cập sự kiện vào tài khoản hiện tại.' : 'Đăng nhập đúng tài khoản được mời để tiếp tục.'}</CardDescription></CardHeader>
        <CardContent>{session ? <AcceptInvitationForm invitationId={inviteId} token={token} /> : <Link href={`/auth/login?next=${encodeURIComponent(`/auth/invitations/${inviteId}?token=${token}`)}`} className='inline-flex min-h-(--control-min-size) w-full items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground'>Đăng nhập để tiếp tục</Link>}</CardContent>
      </Card>
    </main>
  )
}
