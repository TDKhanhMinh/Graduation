import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Cloudinary credentials are not configured" },
        { status: 500 },
      );
    }

    const timestamp = Math.round(new Date().getTime() / 1000);

    // Hardcoded folder for security
    const folder = "wishes_media";

    // Parameters to sign must be sorted alphabetically
    const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto
      .createHash("sha256")
      .update(signatureString)
      .digest("hex");

    return NextResponse.json({
      signature,
      timestamp,
      cloudName,
      apiKey,
      folder,
    });
  } catch (error) {
    console.error("Error generating Cloudinary signature:", error);
    return NextResponse.json(
      { error: "Failed to generate signature" },
      { status: 500 },
    );
  }
}
