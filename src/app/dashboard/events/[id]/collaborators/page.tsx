import { notFound } from 'next/navigation'

import { CollaboratorManager } from '@/components/collaboration/CollaboratorManager'
import { SectionHeading } from '@/components/ui/section-heading'
import { getOwnedEventById } from '@/features/events/dal'

export const metadata = { title: 'Cộng tác viên sự kiện' }

export default async function CollaboratorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await getOwnedEventById(id)
  if (!event) notFound()

  return (
    <div className='space-y-7 pb-10'>
      <SectionHeading as='h1' title='Cộng tác viên' description={`Quản lý quyền truy cập cho sự kiện “${event.title}”.`} />
      <CollaboratorManager eventId={event.id} />
    </div>
  )
}
