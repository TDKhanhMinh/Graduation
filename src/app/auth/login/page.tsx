import Link from "next/link"

import { signIn, signInWithGoogle } from "@/app/auth/actions"
import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { AuthForm } from "@/components/auth/auth-form"
import { AuthErrorToast } from "@/components/auth/auth-error-toast"
import { getSafeNextPath } from "@/utils/url"

type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, next } = await searchParams

  return (
    <AuthPageShell
      title="Đăng nhập"
      description="Truy cập workspace để quản lý sự kiện và những lời chúc của bạn."
      alert={null}
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link
            className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50"
            href="/auth/sign-up"
          >
            Đăng ký
          </Link>
        </p>
      }
    >
      <AuthForm
        action={signIn}
        googleAction={signInWithGoogle}
        mode="sign-in"
        nextPath={getSafeNextPath(next ?? null)}
      />
      {error ? <AuthErrorToast error="Liên kết xác nhận không hợp lệ hoặc đã hết hạn." /> : null}
    </AuthPageShell>
  )
}
