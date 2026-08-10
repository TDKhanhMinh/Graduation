import { z } from 'zod'

export const DIRECTOR_PROTOCOL_VERSION = 1 as const

export const directorSpeedSchema = z.enum(['slow', 'normal', 'fast'])
export type DirectorSpeed = z.infer<typeof directorSpeedSchema>

export const directorWishSchema = z.object({
  id: z.uuid(),
  senderName: z.string(),
  content: z.string(),
  hasMedia: z.boolean(),
})
export type DirectorWish = z.infer<typeof directorWishSchema>

export const directorSnapshotSchema = z.object({
  protocolVersion: z.literal(DIRECTOR_PROTOCOL_VERSION),
  sessionId: z.uuid(),
  eventId: z.uuid(),
  sequence: z.number().int().nonnegative(),
  queue: z.array(directorWishSchema).max(900),
  currentIndex: z.number().int().nonnegative(),
  isPaused: z.boolean(),
  speed: directorSpeedSchema,
  qrVisible: z.boolean(),
  celebrationId: z.string().nullable(),
  updatedAt: z.string(),
})
export type DirectorSnapshot = z.infer<typeof directorSnapshotSchema>

const directorCommandBase = z.object({
  protocolVersion: z.literal(DIRECTOR_PROTOCOL_VERSION),
  sessionId: z.uuid(),
  sequence: z.number().int().positive(),
})

export const directorCommandSchema = z.discriminatedUnion('type', [
  directorCommandBase.extend({ type: z.literal('play') }),
  directorCommandBase.extend({ type: z.literal('pause') }),
  directorCommandBase.extend({ type: z.literal('next') }),
  directorCommandBase.extend({ type: z.literal('previous') }),
  directorCommandBase.extend({ type: z.literal('skip') }),
  directorCommandBase.extend({ type: z.literal('toggle_qr') }),
  directorCommandBase.extend({ type: z.literal('celebrate') }),
  directorCommandBase.extend({ type: z.literal('set_speed'), speed: directorSpeedSchema }),
])
export type DirectorCommand = z.infer<typeof directorCommandSchema>

export function createDirectorSnapshot(input: {
  sessionId: string
  eventId: string
  queue: DirectorWish[]
  currentIndex?: number
  isPaused?: boolean
  speed?: DirectorSpeed
  qrVisible?: boolean
  sequence?: number
}): DirectorSnapshot {
  return directorSnapshotSchema.parse({
    protocolVersion: DIRECTOR_PROTOCOL_VERSION,
    sessionId: input.sessionId,
    eventId: input.eventId,
    sequence: input.sequence ?? 0,
    queue: input.queue,
    currentIndex: Math.min(input.currentIndex ?? 0, Math.max(input.queue.length - 1, 0)),
    isPaused: input.isPaused ?? false,
    speed: input.speed ?? 'normal',
    qrVisible: input.qrVisible ?? false,
    celebrationId: null,
    updatedAt: new Date().toISOString(),
  })
}

export function reduceDirectorCommand(snapshot: DirectorSnapshot, command: DirectorCommand): DirectorSnapshot {
  if (
    command.protocolVersion !== DIRECTOR_PROTOCOL_VERSION
    || command.sessionId !== snapshot.sessionId
    || command.sequence <= snapshot.sequence
  ) return snapshot

  const maxIndex = Math.max(snapshot.queue.length - 1, 0)
  let currentIndex = snapshot.currentIndex
  let queue = snapshot.queue
  let isPaused = snapshot.isPaused
  let speed = snapshot.speed
  let qrVisible = snapshot.qrVisible
  let celebrationId = snapshot.celebrationId

  switch (command.type) {
    case 'play':
      isPaused = false
      break
    case 'pause':
      isPaused = true
      break
    case 'next':
      currentIndex = Math.min(currentIndex + 1, maxIndex)
      isPaused = false
      break
    case 'previous':
      currentIndex = Math.max(currentIndex - 1, 0)
      isPaused = false
      break
    case 'skip':
      if (queue.length > 0) {
        queue = queue.filter((wish) => wish.id !== queue[currentIndex]?.id)
        currentIndex = Math.min(currentIndex, Math.max(queue.length - 1, 0))
      }
      break
    case 'toggle_qr':
      qrVisible = !qrVisible
      break
    case 'celebrate':
      celebrationId = `celebration-${command.sequence}`
      break
    case 'set_speed':
      speed = command.speed
      break
  }

  return directorSnapshotSchema.parse({
    ...snapshot,
    sequence: command.sequence,
    queue,
    currentIndex,
    isPaused,
    speed,
    qrVisible,
    celebrationId,
    updatedAt: new Date().toISOString(),
  })
}
