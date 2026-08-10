'use client'

import { Copy, Mail, Shield, Trash2, UserPlus, X } from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Role = 'editor' | 'moderator' | 'viewer'
type Collaborator = { event_id: string; user_id: string; role: Role; invited_by: string; created_at: string; updated_at: string }
type Invitation = { id: string; event_id: string; email: string; role: Role; token_expires_at: string; accepted_at: string | null; revoked_at: string | null; created_at: string }

const roleLabels: Record<Role, string> = { editor: 'Biên tập viên', moderator: 'Kiểm duyệt viên', viewer: 'Người xem' }

export function CollaboratorManager({ eventId }: { eventId: string }) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('editor')
  const [inviteUrl, setInviteUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetch(`/api/collaborators?eventId=${encodeURIComponent(eventId)}`, { cache: 'no-store' })
      const body = await result.json()
      if (!result.ok) throw new Error(body.error ?? 'Không thể tải danh sách cộng tác viên.')
      setCollaborators(body.collaborators ?? [])
      setInvitations(body.invitations ?? [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải danh sách cộng tác viên.')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  async function createInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    try {
      const result = await fetch('/api/collaborators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, email, role }),
      })
      const body = await result.json()
      if (!result.ok) throw new Error(body.error ?? 'Không thể tạo lời mời.')
      setInviteUrl(new URL(body.inviteUrl, window.location.origin).toString())
      setEmail('')
      await load()
      toast.success('Đã tạo lời mời cộng tác viên.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo lời mời.')
    } finally {
      setSubmitting(false)
    }
  }

  async function updateRole(userId: string, nextRole: Role) {
    const result = await fetch(`/api/collaborators/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, userId, role: nextRole }),
    })
    if (!result.ok) { toast.error('Không thể cập nhật vai trò.'); return }
    setCollaborators((current) => current.map((item) => item.user_id === userId ? { ...item, role: nextRole } : item))
    toast.success('Đã cập nhật vai trò.')
  }

  async function removeCollaborator(userId: string) {
    if (!window.confirm('Xóa quyền cộng tác viên này?')) return
    const result = await fetch(`/api/collaborators/${userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, userId }),
    })
    if (!result.ok) { toast.error('Không thể xóa cộng tác viên.'); return }
    setCollaborators((current) => current.filter((item) => item.user_id !== userId))
    toast.success('Đã xóa quyền cộng tác viên.')
  }

  async function revokeInvitation(invitationId: string) {
    const result = await fetch(`/api/collaborators/invites/${invitationId}/revoke`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId }),
    })
    if (!result.ok) { toast.error('Không thể thu hồi lời mời.'); return }
    setInvitations((current) => current.filter((item) => item.id !== invitationId))
    toast.success('Đã thu hồi lời mời.')
  }

  async function copyInviteUrl() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    toast.success('Đã sao chép liên kết mời.')
  }

  return (
    <div className='grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'><UserPlus aria-hidden='true' className='size-5 text-primary' />Mời cộng tác viên</CardTitle>
          <CardDescription>Lời mời chỉ dùng một lần, hết hạn sau 7 ngày và chỉ người có đúng email mới nhận được.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className='space-y-4' onSubmit={createInvitation}>
            <div className='space-y-2'>
              <label htmlFor='collaborator-email' className='text-sm font-medium'>Email</label>
              <input id='collaborator-email' type='email' required value={email} onChange={(event) => setEmail(event.target.value)} className='flex min-h-(--control-min-size) w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40' placeholder='name@example.com' />
            </div>
            <div className='space-y-2'>
              <label htmlFor='collaborator-role' className='text-sm font-medium'>Vai trò</label>
              <select id='collaborator-role' value={role} onChange={(event) => setRole(event.target.value as Role)} className='flex min-h-(--control-min-size) w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40'>
                {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <Button type='submit' disabled={submitting} className='min-h-(--control-min-size) w-full'><Mail aria-hidden='true' />{submitting ? 'Đang tạo...' : 'Tạo lời mời'}</Button>
          </form>
          {inviteUrl ? (
            <div className='mt-5 space-y-2 rounded-xl border border-status-success/30 bg-status-success/8 p-3'>
              <p className='text-sm font-medium text-status-success'>Liên kết mời đã sẵn sàng</p>
              <div className='flex gap-2'>
                <input readOnly aria-label='Liên kết mời' value={inviteUrl} className='min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-xs' />
                <Button type='button' variant='outline' size='icon' onClick={() => void copyInviteUrl()} aria-label='Sao chép liên kết'><Copy aria-hidden='true' /></Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className='space-y-6'>
        <Card>
          <CardHeader><CardTitle className='flex items-center gap-2'><Shield aria-hidden='true' className='size-5 text-primary' />Quyền truy cập</CardTitle><CardDescription>Vai trò được áp dụng ở lớp API và database; owner vẫn là người quản lý duy nhất.</CardDescription></CardHeader>
          <CardContent>
            {loading ? <p className='text-sm text-muted-foreground'>Đang tải...</p> : collaborators.length === 0 ? <p className='text-sm text-muted-foreground'>Chưa có cộng tác viên đã nhận lời mời.</p> : <ul className='divide-y divide-border/70'>{collaborators.map((item) => <li key={item.user_id} className='flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0'><span className='min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground' title={item.user_id}>{item.user_id}</span><select aria-label={`Vai trò của ${item.user_id}`} value={item.role} onChange={(event) => void updateRole(item.user_id, event.target.value as Role)} className='rounded-lg border border-input bg-background px-2 py-2 text-xs'>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><Button type='button' variant='ghost' size='icon-sm' onClick={() => void removeCollaborator(item.user_id)} aria-label='Xóa cộng tác viên'><Trash2 aria-hidden='true' className='text-status-danger' /></Button></li>)}</ul>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Lời mời đang chờ</CardTitle><CardDescription>Token thô chỉ xuất hiện một lần ngay sau khi tạo.</CardDescription></CardHeader>
          <CardContent>
            {invitations.length === 0 ? <p className='text-sm text-muted-foreground'>Không có lời mời đang chờ.</p> : <ul className='divide-y divide-border/70'>{invitations.map((item) => <li key={item.id} className='flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0'><div className='min-w-0 flex-1'><p className='truncate text-sm font-medium'>{item.email}</p><p className='text-xs text-muted-foreground'>{roleLabels[item.role]} · hết hạn {new Date(item.token_expires_at).toLocaleDateString('vi-VN')}</p></div><Button type='button' variant='ghost' size='sm' onClick={() => void revokeInvitation(item.id)}><X aria-hidden='true' />Thu hồi</Button></li>)}</ul>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
