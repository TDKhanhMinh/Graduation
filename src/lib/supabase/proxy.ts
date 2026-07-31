import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { getSupabaseEnv } from "@/lib/supabase/env"
import type { Database } from "@/types/database"
import { getSafeNextPath } from "@/utils/url"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const { url, publishableKey } = getSupabaseEnv()

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })

        response = NextResponse.next({ request })

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })

        Object.entries(headers).forEach(([name, value]) => {
          response.headers.set(name, value)
        })
      },
    },
  })

  // Keep this call directly after client creation. It verifies the JWT and
  // refreshes expired credentials before Server Components read the cookies.
  const { data } = await supabase.auth.getClaims()

  if (request.nextUrl.pathname.startsWith("/dashboard") && !data?.claims) {
    const loginUrl = request.nextUrl.clone()
    const nextPath = getSafeNextPath(
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    )

    loginUrl.pathname = "/auth/login"
    loginUrl.search = ""
    loginUrl.searchParams.set("next", nextPath)

    return NextResponse.redirect(loginUrl)
  }

  return response
}
