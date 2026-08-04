"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function PublicAvatar({
  wishId,
  path,
  alt,
}: {
  wishId: string;
  path: string;
  alt: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/media/public-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wishId, path, kind: "avatar" }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Avatar unavailable");
        const body = await response.json() as { signedUrl?: string };
        if (active && body.signedUrl) setUrl(body.signedUrl);
      })
      .catch(() => {
        if (active) setUrl(null);
      });

    return () => {
      active = false;
    };
  }, [path, wishId]);

  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
      {url ? <Image src={url} alt={alt} fill className="object-cover" /> : alt.charAt(0).toUpperCase()}
    </div>
  );
}
