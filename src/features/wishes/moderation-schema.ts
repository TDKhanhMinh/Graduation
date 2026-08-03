import { z } from "zod"

export const moderationActions = [
  "approve",
  "reject",
  "hide",
  "pin",
  "unpin",
  "soft_delete",
  "restore",
] as const

export type ModerationAction = (typeof moderationActions)[number]

export const bulkModerationSchema = z.object({
  wishIds: z.array(z.string().uuid()).min(1).max(100),
  action: z.enum(moderationActions),
  reason: z.string().trim().max(500).optional(),
  expectedVersions: z.record(z.string().uuid(), z.string().datetime()).optional(),
})

export type BulkModerationInput = z.infer<typeof bulkModerationSchema>
