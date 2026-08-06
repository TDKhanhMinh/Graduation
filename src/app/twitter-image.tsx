import { ImageResponse } from "next/og"

export const alt = "Memoria — Áp phích, mã QR và bức tường công khai cho sự kiện"
export const size = { width: 1200, height: 600 }
export const contentType = "image/png"

export default function TwitterImage() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "72px", background: "linear-gradient(135deg, #312e81, #c85b91)", color: "white", fontFamily: "sans-serif" }}><div style={{ fontSize: 24, letterSpacing: 5, opacity: 0.75 }}>MEMORIA</div><div style={{ marginTop: 26, fontSize: 64, lineHeight: 1.05, fontWeight: 700 }}>Áp phích là nơi mọi kỷ niệm bắt đầu.</div><div style={{ marginTop: 26, fontSize: 28, opacity: 0.8 }}>Áp phích · Mã QR · Lời chúc · Bức tường công khai</div></div>, { ...size })
}
