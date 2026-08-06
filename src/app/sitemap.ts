import type { MetadataRoute } from "next"

import { getSiteUrl } from "@/lib/supabase/env"

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: getSiteUrl(), changeFrequency: "weekly", priority: 1 }]
}
