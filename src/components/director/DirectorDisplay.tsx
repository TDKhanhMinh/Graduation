'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

import { directorSnapshotSchema, type DirectorSnapshot } from '@/features/director/protocol'

function subscribeToMotion(callback: () => void) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

function getMotionPreference() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getServerMotionPreference() {
  return false
}

export function DirectorDisplay({
  sessionId,
  accessToken,
  initialSnapshot,
}: {
  sessionId: string
  accessToken: string
  initialSnapshot: DirectorSnapshot
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [offline, setOffline] = useState(false)
  const lastCelebrationRef = useRef(initialSnapshot.celebrationId)
  const [celebrationActive, setCelebrationActive] = useState(false)
  const reducedMotion = useSyncExternalStore(subscribeToMotion, getMotionPreference, getServerMotionPreference)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const refresh = async () => {
      if (cancelled || document.visibilityState === 'hidden') {
        timer = setTimeout(refresh, 2000)
        return
      }

      try {
        const response = await fetch(`/api/director/sessions/${sessionId}/display?token=${encodeURIComponent(accessToken)}`, {
          cache: 'no-store',
        })
        if (!response.ok) throw new Error('DIRECTOR_DISPLAY_UNAVAILABLE')
        const payload: unknown = await response.json()
        const parsed = directorSnapshotSchema.safeParse((payload as { snapshot?: unknown }).snapshot)
        if (!parsed.success) throw new Error('DIRECTOR_DISPLAY_INVALID_SNAPSHOT')
        if (!cancelled) {
          if (parsed.data.celebrationId && parsed.data.celebrationId !== lastCelebrationRef.current) {
            lastCelebrationRef.current = parsed.data.celebrationId
            if (!reducedMotion) {
              setCelebrationActive(true)
              setTimeout(() => setCelebrationActive(false), 1600)
            }
          }
          setSnapshot(parsed.data)
          setOffline(false)
        }
      } catch {
        if (!cancelled) setOffline(true)
      } finally {
        if (!cancelled) timer = setTimeout(refresh, 2000)
      }
    }

    void refresh()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [accessToken, reducedMotion, sessionId])

  const current = snapshot.queue[snapshot.currentIndex] ?? null
  const shouldCelebrate = celebrationActive && !reducedMotion

  return (
    <main className={shouldCelebrate ? 'min-h-screen bg-amber-100 p-8 transition-colors' : 'min-h-screen bg-slate-950 p-8 text-white'}>
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center gap-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] opacity-70">Director live display</p>
            <h1 className="mt-2 text-3xl font-semibold">{current?.senderName || 'Waiting for the next wish'}</h1>
          </div>
          <div className="text-right text-sm opacity-70">
            <p>{snapshot.isPaused ? 'Paused' : 'Playing'}</p>
            <p>{snapshot.qrVisible ? 'QR visible' : 'QR hidden'}</p>
            {offline ? <p role="status">Reconnecting...</p> : null}
          </div>
        </header>

        <section aria-live="polite" className="rounded-3xl bg-white p-8 text-slate-950 shadow-2xl sm:p-14">
          <p className="text-xl leading-9 sm:text-3xl sm:leading-[1.45]">
            {current?.content || 'No approved wish is selected.'}
          </p>
        </section>

        <footer className="flex items-center justify-between text-sm opacity-70">
          <span>{snapshot.currentIndex + 1} / {snapshot.queue.length}</span>
          <span>Session v{snapshot.sequence}</span>
        </footer>
      </div>
    </main>
  )
}
