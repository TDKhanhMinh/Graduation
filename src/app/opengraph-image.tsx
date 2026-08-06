import { ImageResponse } from "next/og"

export const alt = "Memoria — Áp phích, mã QR và bức tường công khai cho sự kiện"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "72px", background: "linear-gradient(135deg, #312e81, #7c3aed 55%, #f9a8d4)", color: "white", fontFamily: "sans-serif" }}><div style={{ display: "flex", flexDirection: "column", width: "58%" }}><div style={{ fontSize: 24, letterSpacing: 5, textTransform: "uppercase", opacity: 0.75 }}>MEMORIA</div><div style={{ marginTop: 30, fontSize: 62, lineHeight: 1.05, fontWeight: 700 }}>Áp phích là nơi mọi kỷ niệm bắt đầu.</div><div style={{ marginTop: 24, fontSize: 26, opacity: 0.8 }}>Áp phích · Mã QR · Lời chúc · Bức tường công khai</div></div><div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 280, height: 390, borderRadius: 28, background: "linear-gradient(145deg, #fff7ed, #f9a8d4)", color: "#312e81", transform: "rotate(5deg)", boxShadow: "0 24px 60px rgba(0,0,0,.22)" }}><div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}><div style={{ fontSize: 18, letterSpacing: 3 }}>MỘT NGÀY ĐÁNG NHỚ</div><div style={{ fontSize: 42, fontWeight: 700 }}>Linh &amp; Quân</div><div style={{ width: 88, height: 88, background: "#fff", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700 }}>QR</div><div style={{ fontSize: 18 }}>Quét để chia sẻ</div></div></div></div>, { ...size })
}
