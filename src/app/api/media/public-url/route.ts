import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

type PublicMediaProjection = {
  path?: unknown;
  sender_avatar_path?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      wishId?: unknown;
      path?: unknown;
      kind?: unknown;
    };
    const wishId = typeof body.wishId === "string" ? body.wishId : "";
    const path = typeof body.path === "string" ? body.path : "";
    const kind = body.kind === "avatar" ? "avatar" : "media";

    if (!wishId || !path || path.startsWith("http://") || path.startsWith("https://")) {
      return NextResponse.json({ error: "Yêu cầu tệp đa phương tiện không hợp lệ" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("public_wishes_view")
      .select("media,sender_avatar_path")
      .eq("id", wishId)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "Tệp đa phương tiện không khả dụng" }, { status: 404 });
    }

    const projection = data as PublicMediaProjection & { media?: unknown };
    const media = projection.media as PublicMediaProjection | null;
    const allowedPath = kind === "avatar"
      ? projection.sender_avatar_path
      : media?.path;
    if (allowedPath !== path) {
      return NextResponse.json({ error: "Tệp đa phương tiện không khả dụng" }, { status: 404 });
    }

    const { data: signed, error: signedError } = await supabase
      .storage
      .from("event-media-private")
      .createSignedUrl(path, 2 * 60 * 60);
    if (signedError || !signed?.signedUrl) {
      return NextResponse.json({ error: "Tệp đa phương tiện không khả dụng" }, { status: 404 });
    }

    return NextResponse.json({ signedUrl: signed.signedUrl });
  } catch {
    return NextResponse.json({ error: "Yêu cầu tệp đa phương tiện không hợp lệ" }, { status: 400 });
  }
}
