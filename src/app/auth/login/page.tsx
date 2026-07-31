import Link from "next/link"

import { signIn } from "@/app/auth/actions"
import { AuthForm } from "@/components/auth/auth-form"
import { getSafeNextPath } from "@/utils/url"

type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, next } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-semibold text-emerald-700">
            Graduation
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
            Đăng nhập
          </h1>
          <p className="text-sm leading-6 text-zinc-600">
            Phiên đăng nhập được bảo vệ bằng Supabase Auth và cookie SSR.
          </p>
        </div>

        {error ? (
          <p
            className="mb-5 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            Liên kết xác nhận không hợp lệ hoặc đã hết hạn.
          </p>
        ) : null}

        <AuthForm
          action={signIn}
          mode="sign-in"
          nextPath={getSafeNextPath(next ?? null)}
        />

        <p className="mt-6 text-center text-sm text-zinc-600">
          Chưa có tài khoản?{" "}
          <Link
            className="font-semibold text-emerald-700 hover:text-emerald-800"
            href="/auth/sign-up"
          >
            Đăng ký
          </Link>
        </p>
      </section>
    </main>
  )
}
