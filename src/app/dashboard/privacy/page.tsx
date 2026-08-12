import { LockKeyhole, LogOut, ShieldCheck, UserRound } from 'lucide-react'

import { cancelAccountDeletion, requestAccountDeletion, signOut, signOutAll, updateDisplayName } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { ConfirmActionForm } from '@/components/privacy/ConfirmActionForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionHeading } from '@/components/ui/section-heading'
import { getCurrentProfile } from '@/lib/supabase/queries/profiles'
import { verifySession } from '@/lib/auth/dal'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = {
  title: 'Trung tâm quyền riêng tư',
}

export default async function PrivacyPage() {
  const profile = await getCurrentProfile()
  const session = await verifySession()
  const deletion = session
    ? (await createAdminClient()
      .from('account_deletion_requests')
      .select('status,scheduled_for,started_at,attempts')
      .eq('user_id', session.userId)
      .in('status', ['cooling_off', 'purging'])
      .order('requested_at', { ascending: false })
      .maybeSingle()).data
    : null

  return (
    <div className='space-y-8'>
      <SectionHeading
        as='h1'
        title='Trung tâm quyền riêng tư'
        description='Quản lý hồ sơ, phiên đăng nhập và hiểu rõ các thao tác dữ liệu nhạy cảm.'
      />

      <div className='grid gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'><UserRound aria-hidden='true' className='size-5 text-primary' />Hồ sơ</CardTitle>
            <CardDescription>Chỉ bạn có thể xem và cập nhật thông tin hồ sơ của mình.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateDisplayName} className='space-y-4'>
              <label className='grid gap-2 text-sm font-medium' htmlFor='displayName'>
                Tên hiển thị
                <input
                  id='displayName'
                  name='displayName'
                  defaultValue={profile?.display_name ?? ''}
                  minLength={2}
                  maxLength={100}
                  required
                  autoComplete='name'
                  className='min-h-11 rounded-xl border border-border/80 bg-background/70 px-3 font-normal outline-hidden focus-visible:ring-3 focus-visible:ring-focus/40'
                />
              </label>
              <label className='grid gap-2 text-sm font-medium' htmlFor='avatarUrl'>
                URL avatar (HTTPS)
                <input
                  id='avatarUrl'
                  name='avatarUrl'
                  type='url'
                  defaultValue={profile?.avatar_url ?? ''}
                  maxLength={2048}
                  placeholder='https://...'
                  autoComplete='url'
                  className='min-h-11 rounded-xl border border-border/80 bg-background/70 px-3 font-normal outline-hidden focus-visible:ring-3 focus-visible:ring-focus/40'
                />
              </label>
              <Button type='submit' className='min-h-(--control-min-size)'>Lưu hồ sơ</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'><ShieldCheck aria-hidden='true' className='size-5 text-primary' />Phiên hiện tại</CardTitle>
            <CardDescription>Đăng xuất cục bộ kết thúc phiên trên trình duyệt này.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground'>
              <p className='font-medium text-foreground'>Phiên trình duyệt hiện tại</p>
              <p className='mt-1'>Token phiên không được hiển thị hoặc ghi vào log.</p>
            </div>
            <form action={signOut}>
              <Button type='submit' variant='outline' className='min-h-(--control-min-size) w-full'><LogOut aria-hidden='true' />Đăng xuất thiết bị này</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className='border-status-warning/30'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'><LockKeyhole aria-hidden='true' className='size-5 text-status-warning' />Đăng xuất mọi phiên</CardTitle>
          <CardDescription>Yêu cầu Supabase kết thúc các phiên toàn cục. JWT đã phát hành có thể còn hiệu lực đến khi hết hạn; ứng dụng không tuyên bố thu hồi tức thì ngoài capability này.</CardDescription>
        </CardHeader>
        <CardContent>
          <ConfirmActionForm action={signOutAll} message='Bạn có chắc muốn đăng xuất khỏi mọi phiên trên các thiết bị không?'>
            <Button type='submit' variant='outline' className='min-h-(--control-min-size)'>Đăng xuất mọi phiên</Button>
          </ConfirmActionForm>
        </CardContent>
      </Card>

      <Card id='data-lifecycle'>
        <CardHeader>
          <CardTitle>Vòng đời dữ liệu</CardTitle>
          <CardDescription>Export dữ liệu cá nhân có schema version; yêu cầu xóa bắt đầu cửa sổ khôi phục 30 ngày.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4 text-sm text-muted-foreground'>
          <p>Export chỉ chứa profile, event và wish thuộc tài khoản hiện tại; không gồm token, secret hoặc signed URL hết hạn.</p>
          <div className='flex flex-wrap gap-3'>
            <a href='/api/account/export' className='inline-flex min-h-(--control-min-size) items-center justify-center rounded-xl border px-4 font-medium text-foreground hover:bg-muted'>Tải export dữ liệu</a>
            <ConfirmActionForm action={requestAccountDeletion} message='Yêu cầu này sẽ đăng xuất bạn và bắt đầu thời gian khôi phục 30 ngày. Bạn có chắc muốn tiếp tục không?'>
              <Button type='submit' disabled={Boolean(deletion)} variant='outline' className='min-h-(--control-min-size) border-status-danger/40 text-status-danger'>Yêu cầu xóa tài khoản</Button>
            </ConfirmActionForm>
          </div>
          {deletion?.status === 'cooling_off' ? (
            <div className='rounded-xl border border-status-warning/30 bg-status-warning/10 p-4 text-sm text-foreground'>
              <p>Yêu cầu xóa đang trong thời gian khôi phục đến {new Date(deletion.scheduled_for).toLocaleString('vi-VN')}.</p>
              <ConfirmActionForm action={cancelAccountDeletion} message='Khôi phục tài khoản và dữ liệu đã soft-delete?'>
                <Button type='submit' variant='outline' className='mt-3 min-h-(--control-min-size)'>Hủy yêu cầu và khôi phục</Button>
              </ConfirmActionForm>
            </div>
          ) : deletion?.status === 'purging' ? (
            <p className='text-xs text-status-warning'>Tài khoản đang được xử lý purge; không thể khôi phục.</p>
          ) : null}
          <p className='text-xs'>Dữ liệu được soft-delete ngay khi yêu cầu, có thể khôi phục trong 30 ngày; worker chỉ purge sau khi hết hạn.</p>
        </CardContent>
      </Card>
    </div>
  )
}
