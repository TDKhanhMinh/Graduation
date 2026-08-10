import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { connection, createAdminClient, getReactionCountsBatch, getServerEnv } = vi.hoisted(() => ({
  connection: vi.fn(),
  createAdminClient: vi.fn(),
  getReactionCountsBatch: vi.fn(),
  getServerEnv: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('next/server', () => ({ connection }))
vi.mock('react', () => ({ cache: <T>(callback: T) => callback }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient }))
vi.mock('@/lib/env', () => ({ getServerEnv }))
vi.mock('@/features/reactions/batch', () => ({ getReactionCountsBatch }))

import {
  decodePublicWishCursor,
  encodePublicWishCursor,
  getApprovedWishesByIds,
  getApprovedWishesPage,
} from './dal'

const EVENT_ID = '10000000-0000-4000-8000-000000000001'
const OTHER_EVENT_ID = '20000000-0000-4000-8000-000000000002'
const CREATED_AT = '2026-08-10T00:00:00.000Z'

function makeWish(idSuffix: string, isPinned = false) {
  return {
    id: `30000000-0000-4000-8000-0000000000${idSuffix}`,
    event_id: EVENT_ID,
    sender_name: `Sender ${idSuffix}`,
    sender_avatar_path: null,
    content: `Wish ${idSuffix}`,
    is_pinned: isPinned,
    created_at: CREATED_AT,
    media: null,
  }
}

function makeQuery(rows: ReturnType<typeof makeWish>[]) {
  const result = { data: rows, error: null }
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    or: vi.fn(),
    then: (resolve: (value: typeof result) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  }

  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.order.mockReturnValue(query)
  query.limit.mockReturnValue(query)
  query.or.mockReturnValue(query)

  return query
}

describe('public wish pagination', () => {
  beforeEach(() => {
    connection.mockResolvedValue(undefined)
    getServerEnv.mockReturnValue({
      SUPABASE_SERVICE_ROLE_KEY: 'cursor-secret-used-only-for-unit-tests',
    })
    getReactionCountsBatch.mockResolvedValue({})
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('encrypts a cursor, binds it to its event, and rejects tampering', () => {
    const cursor = {
      created_at: CREATED_AT,
      id: '30000000-0000-4000-8000-000000000099',
      is_pinned: true,
    }
    const encoded = encodePublicWishCursor(EVENT_ID, cursor)

    expect(encoded).not.toContain(EVENT_ID)
    expect(decodePublicWishCursor(encoded, EVENT_ID)).toEqual(cursor)
    expect(decodePublicWishCursor(encoded, OTHER_EVENT_ID)).toBeNull()
    expect(decodePublicWishCursor(`${encoded}x`, EVENT_ID)).toBeNull()
  })

  it('uses the full pinned, timestamp, and ID tuple without overlapping same-timestamp pages', async () => {
    const firstQuery = makeQuery([
      makeWish('03', true),
      makeWish('02', false),
      makeWish('01', false),
    ])
    const secondQuery = makeQuery([makeWish('01', false)])
    const queries = [firstQuery, secondQuery]
    createAdminClient.mockImplementation(() => ({
      from: vi.fn(() => queries.shift()),
    }))

    const firstPage = await getApprovedWishesPage(EVENT_ID, 2)
    expect(firstQuery.limit).toHaveBeenCalledWith(3)
    expect(firstPage.items.map((wish) => wish.id)).toEqual([
      makeWish('03', true).id,
      makeWish('02').id,
    ])
    expect(firstPage.hasMore).toBe(true)
    expect(firstPage.nextCursor).not.toBeNull()
    expect(decodePublicWishCursor(firstPage.nextCursor, EVENT_ID)).toEqual({
      created_at: CREATED_AT,
      id: makeWish('02').id,
      is_pinned: false,
    })

    const secondPage = await getApprovedWishesPage(EVENT_ID, 2, firstPage.nextCursor)
    expect(secondQuery.or).toHaveBeenCalledWith(
      `is_pinned.lt.false,and(is_pinned.eq.false,created_at.lt.${CREATED_AT}),and(is_pinned.eq.false,created_at.eq.${CREATED_AT},id.lt.${makeWish('02').id})`,
    )
    expect(secondPage.items.map((wish) => wish.id)).toEqual([makeWish('01').id])
    expect(secondPage.hasMore).toBe(false)
    expect(secondPage.nextCursor).toBeNull()
    expect(new Set([...firstPage.items, ...secondPage.items].map((wish) => wish.id)).size).toBe(3)
  })

  it('fails closed when reconciliation input exceeds the allowlist limit', async () => {
    await expect(
      getApprovedWishesByIds(
        EVENT_ID,
        Array.from(
          { length: 101 },
          (_, index) => `40000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
        ),
      ),
    ).rejects.toThrow('Invalid public wishes reconciliation request')
    expect(createAdminClient).not.toHaveBeenCalled()
  })
})
