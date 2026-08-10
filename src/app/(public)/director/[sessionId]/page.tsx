import { notFound } from 'next/navigation'

import { DirectorDisplay } from '@/components/director/DirectorDisplay'
import { getDirectorDisplaySession } from '@/features/director/dal'

export const dynamic = 'force-dynamic'

export default async function DirectorDisplayPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>
  searchParams: Promise<{ token?: string | string[] }>
}) {
  const { sessionId } = await params
  const search = await searchParams
  const token = Array.isArray(search.token) ? search.token[0] : search.token
  if (!token) notFound()

  const session = await getDirectorDisplaySession(sessionId, token)
  if (!session) notFound()

  return (
    <DirectorDisplay
      sessionId={sessionId}
      accessToken={token}
      initialSnapshot={session.snapshot}
    />
  )
}
