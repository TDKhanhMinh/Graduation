import Link from "next/link"

import { signInWithGoogle, signUp } from "@/app/auth/actions"
import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { AuthForm } from "@/components/auth/auth-form"

export default function SignUpPage() {
  return (
    <AuthPageShell
      title="Tạo tài khoản"
      description="Tạo workspace an toàn để bắt đầu lưu giữ những khoảnh khắc đáng nhớ."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link
            className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50"
            href="/auth/login"
          >
            Đăng nhập
          </Link>
        </p>
      }
    >
      <AuthForm
        action={signUp}
        googleAction={signInWithGoogle}
        mode="sign-up"
      />
    </AuthPageShell>
  )
}
