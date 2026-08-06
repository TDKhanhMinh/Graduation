import type { MetadataRoute } from "next"

import { getSiteUrl } from "@/lib/supabase/env"

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl()
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/auth", "/api", "/e/"] }], sitemap: `${base}/sitemap.xml`, host: base }
}
