"use client"

import dynamic from "next/dynamic"
import type { InvitationStickerSceneHandle, StickerSceneProps } from "./types"
import React from "react"

export type { InvitationStickerSceneHandle, StickerSceneProps, StickerAction, StickerState, StickerCharacterDefinition } from "./types"
export { STICKER_MANIFEST } from "./sticker-manifest"

export const InvitationStickerScene = dynamic<
  StickerSceneProps & React.RefAttributes<InvitationStickerSceneHandle>
>(() => import("./InvitationStickerScene").then((m) => m.InvitationStickerScene), {
  ssr: false,
  loading: () => null,
})
