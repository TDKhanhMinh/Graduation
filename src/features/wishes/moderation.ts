import "server-only"

import { verifySession } from "@/lib/auth/dal"
import { createError } from "@/lib/observability/error"
import { logger } from "@/lib/observability/logger"
import { createClient } from "@/lib/supabase/server"

import {
  bulkModerationSchema,
  type BulkModerationInput,
  type ModerationAction,
} from "./moderation-schema"

export {
  bulkModerationSchema,
  moderationActions,
  type BulkModerationInput,
  type ModerationAction,
} from "./moderation-schema"

export type ModerationResult = {
  wish_id: string
  moderation_status: string
  is_pinned: boolean
  deleted_at: string | null
  updated_at: string
  audit_id: number
}

const moderationError = (message: string) => {
  if (message.includes("MODERATION_NOT_ALLOWED")) {
    return createError("FORBIDDEN", "Bạn không có quyền kiểm duyệt lời chúc này.")
  }
  if (message.includes("STALE_WISH_VERSION")) {
    return createError(
      "VALIDATION_ERROR",
      "Lời chúc đã thay đổi. Vui lòng tải lại trước khi thử lại."
    )
  }
  if (
    message.includes("INVALID_TRANSITION") ||
    message.includes("PIN_REQUIRES") ||
    message.includes("UNPIN_REQUIRES") ||
    message.includes("RESTORE_WINDOW_EXPIRED")
  ) {
    return createError(
      "VALIDATION_ERROR",
      "Thao tác không hợp lệ với trạng thái hiện tại của lời chúc."
    )
  }
  return createError(
    "INTERNAL_SERVER_ERROR",
    "Không thể cập nhật lời chúc lúc này."
  )
}

export async function bulkModerateWishes(
  input: BulkModerationInput
): Promise<ModerationResult[]> {
  const parsed = bulkModerationSchema.safeParse(input)
  if (!parsed.success) {
    throw createError(
      "VALIDATION_ERROR",
      "Yêu cầu kiểm duyệt không hợp lệ.",
      parsed.error.flatten().fieldErrors
    )
  }

  const session = await verifySession()
  if (!session) {
    throw createError("UNAUTHORIZED", "Vui lòng đăng nhập để kiểm duyệt.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("moderate_wishes", {
    p_wish_ids: parsed.data.wishIds,
    p_action: parsed.data.action,
    p_reason: parsed.data.reason,
    p_expected_versions: parsed.data.expectedVersions,
  })

  if (error) {
    logger.error("Moderation command failed", error, {
      userId: session.userId,
      action: parsed.data.action,
      wishCount: parsed.data.wishIds.length,
    })
    throw moderationError(error.message)
  }

  return data as ModerationResult[]
}

export async function moderateWish({
  wishId,
  action,
  reason,
  expectedUpdatedAt,
}: {
  wishId: string
  action: ModerationAction
  reason?: string
  expectedUpdatedAt?: string
}) {
  const results = await bulkModerateWishes({
    wishIds: [wishId],
    action,
    reason,
    expectedVersions: expectedUpdatedAt
      ? { [wishId]: expectedUpdatedAt }
      : undefined,
  })

  return results[0]
}
