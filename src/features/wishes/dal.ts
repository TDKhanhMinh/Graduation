import 'server-only'

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { connection } from 'next/server'
import { cache } from 'react'
import { z } from 'zod'

import { createAdminClient } from '@/lib/supabase/admin'
import { getServerEnv } from '@/lib/env'
import { Database } from '@/types/database'

export type Wish = Database['public']['Tables']['wishes']['Row']
export type PublicWish = Pick<
  Wish,
  | 'id'
  | 'event_id'
  | 'sender_name'
  | 'sender_avatar_path'
  | 'content'
  | 'is_pinned'
  | 'created_at'
> & {
  media?: {
    path: string
    type: 'image' | 'audio'
    mime_type: string
    width?: number
    height?: number
    duration_ms?: number
  } | null
  reactions?: import('@/features/reactions/dal').ReactionCount[]
}

export type PublicWishCursor = {
  created_at: string
  id: string
  is_pinned: boolean
}

export type PublicWishesPage = {
  items: PublicWish[]
  nextCursor: string | null
  hasMore: boolean
}

export const PUBLIC_WISHES_PAGE_SIZE = 20
const MAX_PUBLIC_WISHES_PAGE_SIZE = 50
const MAX_RECONCILE_WISH_IDS = 100
const CURSOR_VERSION = 'v1'

const publicWishCursorSchema = z.object({
  eventId: z.uuid(),
  created_at: z.iso.datetime({ offset: true }),
  id: z.uuid(),
  is_pinned: z.boolean(),
})

const publicWishIdListSchema = z.array(z.uuid()).max(MAX_RECONCILE_WISH_IDS)

function getCursorKey() {
  return createHash('sha256')
    .update(`${getServerEnv().SUPABASE_SERVICE_ROLE_KEY}:public-wishes:${CURSOR_VERSION}`)
    .digest()
}

export function encodePublicWishCursor(eventId: string, cursor: PublicWishCursor): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getCursorKey(), iv)
  const plaintext = JSON.stringify({ eventId, ...cursor })
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])

  return [
    CURSOR_VERSION,
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    ciphertext.toString('base64url'),
  ].join('.')
}

export function decodePublicWishCursor(
  encodedCursor: string | null | undefined,
  expectedEventId: string,
): PublicWishCursor | null {
  if (!encodedCursor || encodedCursor.length > 1_024) return null

  const [version, encodedIv, encodedAuthTag, encodedCiphertext, ...extraParts] = encodedCursor.split('.')
  if (
    version !== CURSOR_VERSION ||
    !encodedIv ||
    !encodedAuthTag ||
    !encodedCiphertext ||
    extraParts.length > 0
  ) {
    return null
  }

  try {
    const decipher = createDecipheriv('aes-256-gcm', getCursorKey(), Buffer.from(encodedIv, 'base64url'))
    decipher.setAuthTag(Buffer.from(encodedAuthTag, 'base64url'))
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(encodedCiphertext, 'base64url')),
      decipher.final(),
    ]).toString('utf8')
    const parsed = publicWishCursorSchema.safeParse(JSON.parse(plaintext))

    if (!parsed.success || parsed.data.eventId !== expectedEventId) return null

    return {
      created_at: parsed.data.created_at,
      id: parsed.data.id,
      is_pinned: parsed.data.is_pinned,
    }
  } catch {
    return null
  }
}

function normalizePageSize(limit: number) {
  if (!Number.isFinite(limit)) return PUBLIC_WISHES_PAGE_SIZE
  return Math.min(Math.max(Math.trunc(limit), 1), MAX_PUBLIC_WISHES_PAGE_SIZE)
}

function asPublicWish(wish: Database['public']['Views']['public_wishes_view']['Row']): PublicWish | null {
  if (
    !wish.id ||
    !wish.event_id ||
    !wish.sender_name ||
    !wish.created_at ||
    wish.is_pinned === null
  ) {
    return null
  }

  return wish as PublicWish
}

async function addReactionCounts(wishes: PublicWish[]): Promise<PublicWish[]> {
  const reactionCounts = await import('@/features/reactions/batch').then((module) =>
    module.getReactionCountsBatch(wishes.map((wish) => wish.id)),
  )

  return wishes.map((wish) => ({
    ...wish,
    reactions: reactionCounts[wish.id] || [],
  }))
}

export const getApprovedWishesPage = cache(async (
  eventId: string,
  limit: number = PUBLIC_WISHES_PAGE_SIZE,
  encodedCursor?: string | null,
): Promise<PublicWishesPage> => {
  // Server data may be requested from a public link or a Server Action. Keep
  // it at request time so unlisted projections never enter a shared prerender.
  await connection()

  const cursor = encodedCursor === undefined || encodedCursor === null
    ? null
    : decodePublicWishCursor(encodedCursor, eventId)

  if (encodedCursor && !cursor) {
    throw new Error('Invalid public wishes cursor')
  }

  const pageSize = normalizePageSize(limit)
  const supabase = createAdminClient()
  let query = supabase
    .from('public_wishes_view')
    .select('id,event_id,sender_name,sender_avatar_path,content,is_pinned,created_at,media')
    .eq('event_id', eventId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(pageSize + 1)

  if (cursor) {
    query = query.or(
      [
        `is_pinned.lt.${cursor.is_pinned}`,
        `and(is_pinned.eq.${cursor.is_pinned},created_at.lt.${cursor.created_at})`,
        `and(is_pinned.eq.${cursor.is_pinned},created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
      ].join(','),
    )
  }

  const { data, error } = await query

  if (error || !data) {
    console.error('Error fetching public wishes:', error)
    throw new Error('Unable to load public wishes')
  }

  const validWishes = data.map(asPublicWish)
  if (validWishes.some((wish) => !wish)) {
    console.error('Public wishes projection returned an invalid row')
    throw new Error('Unable to load public wishes')
  }

  const hasMore = validWishes.length > pageSize
  const items = await addReactionCounts(validWishes.slice(0, pageSize) as PublicWish[])
  const lastItem = items.at(-1)

  return {
    items,
    hasMore,
    nextCursor: hasMore && lastItem
      ? encodePublicWishCursor(eventId, lastItem)
      : null,
  }
})

export const getApprovedWishesByIds = cache(async (
  eventId: string,
  wishIds: string[],
): Promise<PublicWish[]> => {
  await connection()

  const parsedWishIds = publicWishIdListSchema.safeParse([...new Set(wishIds)])
  if (!parsedWishIds.success) {
    throw new Error('Invalid public wishes reconciliation request')
  }
  if (parsedWishIds.data.length === 0) return []

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('public_wishes_view')
    .select('id,event_id,sender_name,sender_avatar_path,content,is_pinned,created_at,media')
    .eq('event_id', eventId)
    .in('id', parsedWishIds.data)

  if (error || !data) {
    console.error('Error reconciling public wishes:', error)
    throw new Error('Unable to reconcile public wishes')
  }

  const validWishes = data.map(asPublicWish)
  if (validWishes.some((wish) => !wish)) {
    console.error('Public wishes projection returned an invalid reconciliation row')
    throw new Error('Unable to reconcile public wishes')
  }

  return addReactionCounts(validWishes as PublicWish[])
})
