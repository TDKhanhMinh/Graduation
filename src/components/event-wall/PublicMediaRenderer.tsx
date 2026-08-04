"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type MediaProps = {
  wishId: string;
  media: {
    path: string;
    type: "image" | "audio";
    mime_type: string;
  };
};

type Resolution = {
  key: string;
  url: string | null;
  error: boolean;
};

export function PublicMediaRenderer({ wishId, media }: MediaProps) {
  const mediaKey = wishId + ':' + media.path;
  const [resolution, setResolution] = useState<Resolution | null>(null);

  useEffect(() => {
    let active = true;

    void fetch("/api/media/public-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wishId, path: media.path, kind: "media" }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Media unavailable");
        const body = await response.json() as { signedUrl?: string };
        if (!body.signedUrl) throw new Error("Media unavailable");
        if (active) setResolution({ key: mediaKey, url: body.signedUrl, error: false });
      })
      .catch(() => {
        if (active) setResolution({ key: mediaKey, url: null, error: true });
      });

    return () => {
      active = false;
    };
  }, [media.path, mediaKey, wishId]);

  const currentResolution = resolution?.key === mediaKey ? resolution : null;
  const url = currentResolution?.url ?? null;
  const error = currentResolution?.error ?? false;

  if (error) return <div className="rounded-md border p-2 text-sm italic text-red-500">Media unavailable</div>;
  if (!url) return <div className="mt-2 h-32 w-full animate-pulse rounded-md bg-muted" />;

  if (media.type === "image") {
    return (
      <div className="relative mt-2 w-full overflow-hidden rounded-md bg-muted pt-[56.25%]">
        <Image src={url} alt="User uploaded media" fill className="object-contain" />
      </div>
    );
  }

  return (
    <div className="mt-2 w-full rounded-md bg-muted/30 p-2">
      <audio src={url} controls className="h-10 w-full" preload="none" />
    </div>
  );
}
