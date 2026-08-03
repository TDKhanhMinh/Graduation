"use client"

import { useEffect, useReducer, useSyncExternalStore } from "react"

import {
  deviceStorageKey,
  draftStorageKey,
  EMPTY_WISH_DRAFT,
  parseStoredWishDraft,
  serializeWishDraft,
  wishDraftReducer,
} from "./draft"

const newId = () => crypto.randomUUID()
const subscribeToHydration = () => () => {}
const getClientHydrationSnapshot = () => true
const getServerHydrationSnapshot = () => false

export function useWishDraft(eventId: string) {
  const [draft, dispatch] = useReducer(wishDraftReducer, EMPTY_WISH_DRAFT)
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot
  )

  useEffect(() => {
    const existingDeviceKey = window.localStorage.getItem(deviceStorageKey)
    const deviceKey = existingDeviceKey || newId()
    if (!existingDeviceKey) {
      window.localStorage.setItem(deviceStorageKey, deviceKey)
    }

    const stored = window.localStorage.getItem(draftStorageKey(eventId))
    dispatch({
      type: "hydrate",
      draft: parseStoredWishDraft(stored, newId(), deviceKey),
    })
  }, [eventId])

  useEffect(() => {
    if (!hydrated || !draft.clientRequestId || !draft.deviceKey) return
    window.localStorage.setItem(
      draftStorageKey(eventId),
      JSON.stringify(serializeWishDraft(draft))
    )
  }, [draft, eventId, hydrated])

  const beginNewDraft = () => {
    window.localStorage.removeItem(draftStorageKey(eventId))
    dispatch({ type: "newDraft", clientRequestId: newId() })
  }

  return {
    draft,
    hydrated,
    setContent: (value: string) => dispatch({ type: "content", value }),
    setSenderName: (value: string) =>
      dispatch({ type: "senderName", value }),
    setMediaPath: (value?: string) => dispatch({ type: "mediaPath", value }),
    setSenderAvatarPath: (value?: string) => dispatch({ type: "senderAvatarPath", value }),
    beginNewDraft,
  }
}
