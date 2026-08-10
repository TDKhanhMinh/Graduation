import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { PublicWish, PublicWishesPage } from '@/features/wishes/dal'

const realtime = vi.hoisted(() => ({
  onEvent: undefined as undefined | ((event: { action: 'upsert' | 'remove'; wish_id: string }) => void),
}))

vi.mock('@/components/effects/effect-provider', () => ({
  useEffectState: () => ({
    config: { preset: 'minimal', intensity: 'off', particles: false, reactions: false },
    reducedMotion: true,
    setPreset: vi.fn(),
    setIntensity: vi.fn(),
  }),
}))
vi.mock('@/components/effects/memory-constellation', () => ({ MemoryConstellation: () => null }))
vi.mock('@/components/effects/wish-spotlight-effect', () => ({ WishSpotlightEffect: () => null }))
vi.mock('@/components/ui/feedback-state', () => ({
  FeedbackState: ({ title }: { title: string }) => <div>{title}</div>,
}))
vi.mock('@/features/wall/components/wall-stage', () => ({
  WallStage: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  WallLayer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/event-wall/WishCard', () => ({
  WishCard: ({ wish }: { wish: PublicWish }) => <article>{wish.content}</article>,
}))
vi.mock('@/features/wishes/realtime', () => ({
  useRealtimeWallEvents: (_eventId: string, onEvent: typeof realtime.onEvent) => {
    realtime.onEvent = onEvent
    return { status: 'connected', lastSyncAt: null }
  },
}))

import { mergePublicWishes, RealtimeWall } from './RealtimeWall'

const EVENT_ID = '10000000-0000-4000-8000-000000000001'

function makeWish(id: string, content: string, isPinned = false): PublicWish {
  return {
    id,
    event_id: EVENT_ID,
    sender_name: 'Sender',
    sender_avatar_path: null,
    content,
    is_pinned: isPinned,
    created_at: '2026-08-10T00:00:00.000Z',
    media: null,
    reactions: [],
  }
}

function makePage(items: PublicWish[], hasMore: boolean, nextCursor: string | null): PublicWishesPage {
  return { items, hasMore, nextCursor }
}

describe('RealtimeWall pagination', () => {
  afterEach(() => {
    realtime.onEvent = undefined
    vi.clearAllMocks()
  })

  it('merges updated and overlapping batches without duplicate wishes', () => {
    const original = makeWish('30000000-0000-4000-8000-000000000001', 'Original')
    const updated = makeWish(original.id, 'Updated', true)
    const added = makeWish('30000000-0000-4000-8000-000000000002', 'Added')

    expect(mergePublicWishes([original], [updated, added])).toEqual([updated, added])
  })

  it('announces loading, appends the next page once, and shows the end state', async () => {
    const initialWish = makeWish('30000000-0000-4000-8000-000000000001', 'Initial')
    const nextWish = makeWish('30000000-0000-4000-8000-000000000002', 'Loaded next')
    let resolveLoad: ((value: PublicWishesPage) => void) | undefined
    const fetchWishesAction = vi.fn(() => new Promise<PublicWishesPage>((resolve) => {
      resolveLoad = resolve
    }))

    render(
      <RealtimeWall
        eventId={EVENT_ID}
        initialWishes={[initialWish]}
        initialNextCursor='opaque-cursor'
        initialHasMore
        fetchWishesAction={fetchWishesAction}
        reconcileWishesAction={vi.fn().mockResolvedValue([])}
      />,
    )

    const loadMoreButton = screen.getByRole('button', { name: 'T\u1ea3i th\u00eam l\u1eddi ch\u00fac' })
    fireEvent.click(loadMoreButton)
    expect(loadMoreButton).toHaveAttribute('aria-busy', 'true')

    await act(async () => {
      resolveLoad?.(makePage([initialWish, nextWish], false, null))
    })

    expect(fetchWishesAction).toHaveBeenCalledWith('opaque-cursor')
    expect(screen.getByText('Loaded next')).toBeVisible()
    expect(screen.getAllByText('Initial')).toHaveLength(1)
    expect(screen.getByText('\u0110\u00e3 t\u1ea3i t\u1ea5t c\u1ea3 l\u1eddi ch\u00fac.')).toBeVisible()
  })

  it('offers retry after a failed load and removes wishes invalidated by realtime', async () => {
    const initialWish = makeWish('30000000-0000-4000-8000-000000000001', 'Remove me')
    const fetchWishesAction = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(makePage([initialWish], false, null))

    render(
      <RealtimeWall
        eventId={EVENT_ID}
        initialWishes={[initialWish]}
        initialNextCursor='opaque-cursor'
        initialHasMore
        fetchWishesAction={fetchWishesAction}
        reconcileWishesAction={vi.fn().mockResolvedValue([])}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'T\u1ea3i th\u00eam l\u1eddi ch\u00fac' }))
    await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('button', { name: 'Th\u1eed l\u1ea1i' }))
    await waitFor(() => expect(screen.getByText('\u0110\u00e3 t\u1ea3i t\u1ea5t c\u1ea3 l\u1eddi ch\u00fac.')).toBeVisible())

    act(() => realtime.onEvent?.({ action: 'remove', wish_id: initialWish.id }))
    expect(screen.queryByText('Remove me')).not.toBeInTheDocument()
  })
})
