export const WISH_DRAFT_VERSION = 1
export const MAX_SENDER_NAME_LENGTH = 100
export const MAX_URLS = 2

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>{}[\]]+/gi

export type WishDraft = {
  content: string
  senderName: string
  clientRequestId: string
  deviceKey: string
  mediaPath?: string
  senderAvatarPath?: string
}

export type StoredWishDraft = WishDraft & {
  version: typeof WISH_DRAFT_VERSION
}

export type WishDraftAction =
  | { type: "hydrate"; draft: WishDraft }
  | { type: "content"; value: string }
  | { type: "senderName"; value: string }
  | { type: "mediaPath"; value?: string }
  | { type: "senderAvatarPath"; value?: string }
  | { type: "newDraft"; clientRequestId: string }

export const EMPTY_WISH_DRAFT: WishDraft = {
  content: "",
  senderName: "",
  clientRequestId: "",
  deviceKey: "",
}

export function wishDraftReducer(
  state: WishDraft,
  action: WishDraftAction
): WishDraft {
  switch (action.type) {
    case "hydrate":
      return action.draft
    case "content":
      return { ...state, content: action.value }
    case "senderName":
      return { ...state, senderName: action.value }
    case "mediaPath":
      return { ...state, mediaPath: action.value }
    case "senderAvatarPath":
      return { ...state, senderAvatarPath: action.value }
    case "newDraft":
      return {
        ...state,
        content: "",
        senderName: "",
        mediaPath: undefined,
        senderAvatarPath: undefined,
        clientRequestId: action.clientRequestId,
      }
  }
}

export const draftStorageKey = (eventId: string) =>
  `graduation:wish-draft:v${WISH_DRAFT_VERSION}:${eventId}`

export const deviceStorageKey = "graduation:wish-device:v1"

export function parseStoredWishDraft(
  value: string | null,
  fallbackClientRequestId: string,
  deviceKey: string
): WishDraft {
  if (!value) {
    return {
      ...EMPTY_WISH_DRAFT,
      clientRequestId: fallbackClientRequestId,
      deviceKey,
    }
  }

  try {
    const parsed = JSON.parse(value) as Partial<StoredWishDraft>
    if (parsed.version !== WISH_DRAFT_VERSION) {
      throw new Error("Unsupported draft version")
    }

    return {
      content: typeof parsed.content === "string" ? parsed.content : "",
      senderName:
        typeof parsed.senderName === "string" ? parsed.senderName : "",
      mediaPath: typeof parsed.mediaPath === "string" ? parsed.mediaPath : undefined,
      senderAvatarPath: typeof parsed.senderAvatarPath === "string" ? parsed.senderAvatarPath : undefined,
      clientRequestId:
        typeof parsed.clientRequestId === "string" &&
        UUID_PATTERN.test(parsed.clientRequestId)
          ? parsed.clientRequestId
          : fallbackClientRequestId,
      deviceKey,
    }
  } catch {
    return {
      ...EMPTY_WISH_DRAFT,
      clientRequestId: fallbackClientRequestId,
      deviceKey,
    }
  }
}

export const serializeWishDraft = (draft: WishDraft): StoredWishDraft => ({
  version: WISH_DRAFT_VERSION,
  content: draft.content,
  senderName: draft.senderName,
  mediaPath: draft.mediaPath,
  senderAvatarPath: draft.senderAvatarPath,
  clientRequestId: draft.clientRequestId,
  deviceKey: draft.deviceKey,
})

export const countDraftUrls = (content: string) =>
  content.match(URL_PATTERN)?.length ?? 0

export function validateWishContent(content: string, maxLength: number) {
  const trimmed = content.trim()
  if (!trimmed) return "Hãy nhập nội dung lời chúc."
  if (trimmed.length > maxLength) {
    return `Lời chúc không được vượt quá ${maxLength} ký tự.`
  }
  if (countDraftUrls(trimmed) > MAX_URLS) {
    return `Lời chúc chỉ được chứa tối đa ${MAX_URLS} đường dẫn.`
  }
  return null
}

export function validateSenderName(senderName: string) {
  const trimmed = senderName.trim()
  if (!trimmed) return "Hãy nhập tên hiển thị."
  if (trimmed.length > MAX_SENDER_NAME_LENGTH) {
    return `Tên không được vượt quá ${MAX_SENDER_NAME_LENGTH} ký tự.`
  }
  return null
}
