import Link from "next/link"

import {
  signOut,
  updateDisplayName,
} from "@/app/auth/actions"
import { verifySession } from "@/lib/auth/dal"
import { getCurrentProfile } from "@/lib/supabase/queries/profiles"

export const dynamic = "force-dynamic"

export default async function Home() {
  const session = await verifySession()
  const profile = session ? await getCurrentProfile() : null

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16 text-zinc-100">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-4">
          <div className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Supabase backend ready
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Nền tảng Auth và dữ liệu đã kết nối.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-zinc-400">
            Next.js Server Components đọc dữ liệu qua Supabase SSR; quyền truy
            cập hồ sơ được cưỡng chế tại PostgreSQL bằng RLS.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
          {session ? (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-zinc-400">Đã đăng nhập</p>
                <h2 className="mt-1 text-2xl font-semibold">
                  {profile?.display_name ?? session.email ?? session.userId}
                </h2>
                <p className="mt-2 break-all text-sm text-zinc-500">
                  User ID: {session.userId}
                </p>
              </div>

              <form action={updateDisplayName} className="max-w-md space-y-3">
                <label
                  className="block text-sm font-medium text-zinc-200"
                  htmlFor="displayName"
                >
                  Cập nhật tên hiển thị
                </label>
                <div className="flex gap-3">
                  <input
                    className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-3 focus:ring-emerald-400/15"
                    defaultValue={profile?.display_name ?? ""}
                    id="displayName"
                    maxLength={100}
                    minLength={2}
                    name="displayName"
                    required
                    type="text"
                  />
                  <button
                    className="rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
                    type="submit"
                  >
                    Lưu
                  </button>
                </div>
              </form>

              <form action={signOut}>
                <button
                  className="text-sm font-semibold text-zinc-300 underline decoration-white/20 underline-offset-4 hover:text-white"
                  type="submit"
                >
                  Đăng xuất
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-zinc-400">Chưa có phiên đăng nhập</p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Kiểm chứng luồng Auth end-to-end
                </h2>
              </div>
              <div className="flex gap-3">
                <Link
                  className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5"
                  href="/auth/login"
                >
                  Đăng nhập
                </Link>
                <Link
                  className="rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-300"
                  href="/auth/sign-up"
                >
                  Đăng ký
                </Link>
              </div>
            </div>
          )}
        </section>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Database", "PostgreSQL 17 + migration"],
            ["Security", "RLS + publishable key"],
            ["Session", "Cookie SSR + Proxy"],
          ].map(([label, value]) => (
            <article
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              key={label}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {label}
              </p>
              <p className="mt-2 text-sm font-medium text-zinc-200">{value}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
