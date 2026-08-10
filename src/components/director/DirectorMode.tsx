'use client'

import { Bell, ChevronLeft, ChevronRight, Pause, Play, QrCode, Sparkles, SkipForward } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { createTimelinePlan, useTimelinePlayback } from '@/features/wall/animations/timeline'
import {
  directorCommandSchema,
  directorSnapshotSchema,
  reduceDirectorCommand,
  type DirectorCommand,
  type DirectorSnapshot,
  type DirectorSpeed,
  type DirectorWish,
} from '@/features/director/protocol'

type LiveSession = {
  sessionId: string
  displayUrl: string
}

export function DirectorMode({
  eventId,
  initialWishes,
  initialQrVisible,
  initialAnimationSpeed,
}: {
  eventId: string
  initialWishes: DirectorWish[]
  initialQrVisible: boolean
  initialAnimationSpeed: DirectorSpeed
}) {
  const [queue, setQueue] = useState(initialWishes)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState<DirectorSpeed>(initialAnimationSpeed)
  const [qrVisible, setQrVisible] = useState(initialQrVisible)
  const [celebration, setCelebration] = useState(false)
  const [notification, setNotification] = useState('Director mode is ready')
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null)
  const [liveSnapshot, setLiveSnapshot] = useState<DirectorSnapshot | null>(null)
  const sequenceRef = useRef(0)
  const { play: playTimeline } = useTimelinePlayback(false, () => setNotification('Finished the current wish'))

  const activeQueue = liveSnapshot?.queue ?? queue
  const activeIndex = liveSnapshot?.currentIndex ?? currentIndex
  const activePaused = liveSnapshot?.isPaused ?? isPaused
  const activeSpeed = liveSnapshot?.speed ?? speed
  const activeQrVisible = liveSnapshot?.qrVisible ?? qrVisible
  const activeCelebration = Boolean(liveSnapshot?.celebrationId) || celebration
  const current = activeQueue[activeIndex] ?? null
  const next = activeQueue[activeIndex + 1] ?? null

  const playbackScale = activeSpeed === 'slow' ? 1.25 : activeSpeed === 'fast' ? 0.8 : 1
  const currentDuration = useMemo(() => {
    if (!current) return 0
    return Math.round(createTimelinePlan({ contentType: current.hasMedia ? 'image' : 'text' }).totalDuration * playbackScale)
  }, [current, playbackScale])

  useEffect(() => {
    if (!liveSession) return
    const supabase = createClient()
    const channel = supabase
      .channel(`director-session:${liveSession.sessionId}`, { config: { private: true } })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'director_sessions',
        filter: `id=eq.${liveSession.sessionId}`,
      }, (payload) => {
        const parsed = directorSnapshotSchema.safeParse((payload.new as { snapshot?: unknown }).snapshot)
        if (parsed.success && parsed.data.sequence >= sequenceRef.current) {
          sequenceRef.current = parsed.data.sequence
          setLiveSnapshot(parsed.data)
        }
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [liveSession])

  function announce(message: string) {
    setNotification(message)
  }

  async function sendLiveCommand(command: DirectorCommand) {
    if (!liveSession || !liveSnapshot) return
    const nextSnapshot = reduceDirectorCommand(liveSnapshot, command)
    sequenceRef.current = command.sequence
    setLiveSnapshot(nextSnapshot)

    try {
      const response = await fetch(`/api/director/sessions/${liveSession.sessionId}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedVersion: liveSnapshot.sequence, command }),
      })
      const payload = await response.json() as { snapshot?: unknown }
      const parsed = directorSnapshotSchema.safeParse(payload.snapshot)
      if (parsed.success) {
        sequenceRef.current = parsed.data.sequence
        setLiveSnapshot(parsed.data)
      }
      if (!response.ok) announce('Live session changed elsewhere; local state reconciled')
    } catch {
      announce('Live connection unavailable; continuing with local fallback')
    }
  }

  function dispatch(type: DirectorCommand['type'], speedValue?: DirectorSpeed) {
    if (!liveSession || !liveSnapshot) return false
    const sequence = Math.max(sequenceRef.current, liveSnapshot.sequence) + 1
    const raw = speedValue ? {
      protocolVersion: 1 as const,
      sessionId: liveSession.sessionId,
      sequence,
      type,
      speed: speedValue,
    } : {
      protocolVersion: 1 as const,
      sessionId: liveSession.sessionId,
      sequence,
      type,
    }
    const parsed = directorCommandSchema.safeParse(raw)
    if (!parsed.success) return true
    void sendLiveCommand(parsed.data)
    return true
  }

  function selectNext() {
    if (dispatch('next')) {
      announce('Next wish is being displayed live')
      return
    }
    if (!queue.length) return
    const index = Math.min(currentIndex + 1, queue.length - 1)
    setCurrentIndex(index)
    setIsPaused(false)
    const wish = queue[index]
    playTimeline(createTimelinePlan({ contentType: wish.hasMedia ? 'image' : 'text' }))
    announce('Next wish is being displayed')
  }

  function selectPrevious() {
    if (dispatch('previous')) {
      announce('Previous wish is being displayed live')
      return
    }
    if (!queue.length) return
    const index = Math.max(currentIndex - 1, 0)
    setCurrentIndex(index)
    setIsPaused(false)
    const wish = queue[index]
    playTimeline(createTimelinePlan({ contentType: wish.hasMedia ? 'image' : 'text' }))
    announce('Previous wish is being displayed')
  }

  function skipCurrent() {
    if (!current) return
    if (dispatch('skip')) {
      announce('Wish skipped in the live session')
      return
    }
    setQueue((items) => items.filter((item) => item.id !== current.id))
    setCurrentIndex((index) => Math.min(index, Math.max(queue.length - 2, 0)))
    announce('Wish skipped locally')
  }

  function togglePlayback() {
    if (dispatch(activePaused ? 'play' : 'pause')) {
      announce(activePaused ? 'Live playback resumed' : 'Live playback paused')
      return
    }
    setIsPaused((value) => !value)
    announce(activePaused ? 'Playback resumed' : 'Playback paused')
  }

  function changeSpeed(value: DirectorSpeed) {
    if (dispatch('set_speed', value)) {
      announce('Live playback speed updated')
      return
    }
    setSpeed(value)
    announce('Playback speed updated')
  }

  function toggleQr() {
    if (dispatch('toggle_qr')) {
      announce(activeQrVisible ? 'QR hidden on the live display' : 'QR shown on the live display')
      return
    }
    setQrVisible((value) => !value)
    announce(activeQrVisible ? 'QR hidden locally' : 'QR shown locally')
  }

  function triggerCelebration() {
    if (dispatch('celebrate')) {
      announce('Celebration sent to the live display')
      return
    }
    setCelebration(true)
    announce('Celebration enabled locally')
  }

  async function startLiveSession() {
    if (liveSession) return
    try {
      const response = await fetch('/api/director/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, queue, qrVisible, speed }),
      })
      const payload = await response.json() as { sessionId?: string; displayUrl?: string; snapshot?: unknown }
      const parsed = directorSnapshotSchema.safeParse(payload.snapshot)
      if (!response.ok || !payload.sessionId || !payload.displayUrl || !parsed.success) throw new Error('DIRECTOR_SESSION_START_FAILED')
      setLiveSession({ sessionId: payload.sessionId, displayUrl: payload.displayUrl })
      sequenceRef.current = parsed.data.sequence
      setLiveSnapshot(parsed.data)
      announce('Live session started; open the display link on a second screen')
    } catch {
      announce('Unable to start live session; continuing locally')
    }
  }

  return (
    <section className='space-y-6' aria-labelledby='director-mode-heading'>
      <div className='flex flex-col gap-4 rounded-3xl border border-primary/20 bg-card p-5 shadow-sm sm:p-7 lg:flex-row lg:items-end lg:justify-between'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.18em] text-primary'>Director control</p>
          <h2 id='director-mode-heading' className='mt-1 font-heading text-xl font-semibold'>Live event display</h2>
          <p className='mt-2 max-w-2xl text-sm leading-6 text-muted-foreground'>Commands are event-scoped, versioned and recover through the latest snapshot. Effects remain decorative.</p>
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          {liveSession ? (
            <Link href={liveSession.displayUrl} target='_blank' rel='noreferrer' className='text-sm font-medium text-primary underline-offset-4 hover:underline'>Open display</Link>
          ) : (
            <Button type='button' onClick={() => void startLiveSession()}>Start live session</Button>
          )}
          <Link href={`/dashboard/events/${eventId}/moderation`} className='text-sm font-medium text-primary underline-offset-4 hover:underline'>Open moderation</Link>
        </div>
      </div>

      <p role='status' aria-live='polite' className='rounded-xl border border-status-info/30 bg-status-info/10 px-4 py-3 text-sm text-status-info'>{notification}</p>

      <div className='grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]'>
        <div className='min-w-0 rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground'>Now displaying</p>
              <p className='mt-1 text-lg font-semibold'>{current ? current.senderName : 'Empty queue'}</p>
            </div>
            <span className='rounded-full bg-muted px-3 py-1 text-xs font-medium'>{current ? `${activeIndex + 1} / ${activeQueue.length}` : '0 / 0'}</span>
          </div>
          <blockquote className='mt-5 rounded-2xl border border-primary/15 bg-[var(--brand-50)] p-5 text-base leading-7'>{current?.content || 'No wish selected.'}</blockquote>
          <div className='mt-5 flex flex-wrap gap-2'>
            <Button type='button' variant='outline' onClick={selectPrevious} disabled={!current || activeIndex === 0}><ChevronLeft aria-hidden='true' />Previous</Button>
            <Button type='button' variant='outline' onClick={selectNext} disabled={!current || activeIndex >= activeQueue.length - 1}><ChevronRight aria-hidden='true' />Next</Button>
            <Button type='button' variant={activePaused ? 'default' : 'soft'} onClick={togglePlayback} disabled={!current}>{activePaused ? <><Play aria-hidden='true' />Resume</> : <><Pause aria-hidden='true' />Pause</>}</Button>
            <Button type='button' variant='ghost' onClick={skipCurrent} disabled={!current}><SkipForward aria-hidden='true' />Skip</Button>
          </div>
          <p className='mt-4 text-xs text-muted-foreground'>Estimated duration: {currentDuration ? `${Math.round(currentDuration / 1000)}s` : '—'} · snapshot sequence {liveSnapshot?.sequence ?? 0}</p>
        </div>

        <aside className='space-y-4 rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6' aria-label='Director controls'>
          <h3 className='font-semibold'>Display controls</h3>
          <label className='grid gap-2 text-sm'>
            <span className='font-medium'>Playback speed</span>
            <select value={activeSpeed} onChange={(event) => changeSpeed(event.target.value as DirectorSpeed)} className='min-h-11 rounded-xl border border-border/80 bg-background px-3'>
              <option value='slow'>Slow</option>
              <option value='normal'>Normal</option>
              <option value='fast'>Fast</option>
            </select>
          </label>
          <Button type='button' variant={activeQrVisible ? 'soft' : 'outline'} className='w-full justify-start' onClick={toggleQr}><QrCode aria-hidden='true' />{activeQrVisible ? 'Hide QR' : 'Show QR'}</Button>
          <Button type='button' variant={activeCelebration ? 'default' : 'outline'} className='w-full justify-start' onClick={triggerCelebration}><Sparkles aria-hidden='true' />{activeCelebration ? 'Celebration sent' : 'Celebrate'}</Button>
          <Button type='button' variant='outline' className='w-full justify-start' onClick={() => announce('Local notice sent')}><Bell aria-hidden='true' />Announce locally</Button>
        </aside>
      </div>

      <div className='rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6'>
        <h3 className='font-semibold'>Up next</h3>
        <p className='mt-1 text-sm text-muted-foreground'>{next ? `${next.senderName}: ${next.content}` : 'No next item in the queue.'}</p>
      </div>
    </section>
  )
}
