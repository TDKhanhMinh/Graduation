const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
const vercelUrl =
  process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL

export function getSupabaseEnv() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    )
  }

  return {
    url: supabaseUrl,
    publishableKey: supabasePublishableKey,
  }
}

export function getSiteUrl() {
  const url = siteUrl ?? vercelUrl ?? "http://localhost:3000"
  const absoluteUrl = url.startsWith("http") ? url : `https://${url}`

  return absoluteUrl.replace(/\/$/, "")
}
