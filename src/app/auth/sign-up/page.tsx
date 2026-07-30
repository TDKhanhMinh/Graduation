import Link from "next/link"

import { signUp } from "@/app/auth/actions"
import { AuthForm } from "@/components/auth/auth-form"

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-semibold text-emerald-700">
            Graduation
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
            Tạo tài khoản
          </h1>
          <p className="text-sm leading-6 text-zinc-600">
            Hồ sơ được tạo tự động và bảo vệ bằng Row Level Security.
          </p>
        </div>

        <AuthForm action={signUp} mode="sign-up" />

        <p className="mt-6 text-center text-sm text-zinc-600">
          Đã có tài khoản?{" "}
          <Link
            className="font-semibold text-emerald-700 hover:text-emerald-800"
            href="/auth/login"
          >
            Đăng nhập
          </Link>
        </p>
      </section>
    </main>
  )
}
