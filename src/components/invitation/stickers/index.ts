"use client";

import dynamic from "next/dynamic";
import React from "react";
import type { InvitationStickerSceneHandle, StickerSceneProps } from "./types";

export { STICKER_MANIFEST } from "./sticker-manifest";
export type {
  InvitationStickerSceneHandle,
  StickerAction,
  StickerCharacterDefinition,
  StickerSceneProps,
  StickerState,
} from "./types";

export const InvitationStickerScene = dynamic<
  StickerSceneProps & React.RefAttributes<InvitationStickerSceneHandle>
>(
  () =>
    import("./InvitationStickerScene").then((m) => m.InvitationStickerScene),
  {
    ssr: false,
    loading: () => null,
  },
);
