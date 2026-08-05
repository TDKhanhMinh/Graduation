"use client"

import { LoaderCircle } from "lucide-react"
import { useActionState } from "react"

import type { AuthActionState } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type AuthAction = (
  state: AuthActionState,
  formData: FormData
) => Promise<AuthActionState>

type AuthFormProps = {
  action: AuthAction
  googleAction: AuthAction
  mode: "sign-in" | "sign-up"
  nextPath?: string
}

const initialState: AuthActionState = {}

export function AuthForm({ action, googleAction, mode, nextPath }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const [googleState, googleFormAction, googlePending] = useActionState(
    googleAction,
    initialState
  )
  const isSignUp = mode === "sign-up"
  const errorId = "auth-form-error"
  const googleErrorId = "google-auth-error"
  const anyPending = pending || googlePending

  return (
    <div className="space-y-5">
      <form
        action={formAction}
        className="space-y-5"
        aria-describedby={state.error ? errorId : undefined}
      >
        {nextPath ? <input name="next" type="hidden" value={nextPath} /> : null}

        {isSignUp ? (
          <div className="grid gap-2">
            <Label htmlFor="displayName">Tên hiển thị</Label>
            <Input
              autoComplete="name"
              className="h-11"
              id="displayName"
              maxLength={100}
              minLength={2}
              name="displayName"
              required
              type="text"
            />
          </div>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            autoComplete="email"
            className="h-11"
            id="email"
            name="email"
            required
            type="email"
            aria-invalid={Boolean(state.error)}
            aria-describedby={state.error ? errorId : undefined}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <Input
            autoComplete={isSignUp ? "new-password" : "current-password"}
            className="h-11"
            id="password"
            minLength={8}
            name="password"
            required
            type="password"
            aria-invalid={Boolean(state.error)}
            aria-describedby={state.error ? errorId : undefined}
          />
          {isSignUp ? (
            <p className="text-xs leading-5 text-muted-foreground">
              Ít nhất 8 ký tự, gồm chữ và số.
            </p>
          ) : null}
        </div>

        {state.error ? (
          <p
            id={errorId}
            className="rounded-lg border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}

        {state.message ? (
          <p
            className="rounded-lg border border-status-success/30 bg-status-success/10 px-3 py-2 text-sm text-status-success"
            role="status"
          >
            {state.message}
          </p>
        ) : null}

        <Button
          className="min-h-(--control-min-size) w-full"
          disabled={anyPending}
          type="submit"
        >
          {pending ? (
            <>
              <LoaderCircle aria-hidden="true" className="animate-spin" />
              Đang xử lý…
            </>
          ) : isSignUp ? (
            "Tạo tài khoản"
          ) : (
            "Đăng nhập"
          )}
        </Button>
      </form>

      <div className="relative" aria-hidden="true">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Hoặc tiếp tục với
          </span>
        </div>
      </div>

      <form
        action={googleFormAction}
        aria-describedby={googleState.error ? googleErrorId : undefined}
      >
        {nextPath ? <input name="next" type="hidden" value={nextPath} /> : null}
        {googleState.error ? (
          <p
            id={googleErrorId}
            className="mb-3 rounded-lg border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger"
            role="alert"
          >
            {googleState.error}
          </p>
        ) : null}
        <Button
          className="min-h-(--control-min-size) w-full"
          disabled={anyPending}
          type="submit"
          variant="outline"
        >
          {googlePending ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          ) : (
            <span aria-hidden="true" className="font-semibold text-primary">
              G
            </span>
          )}
          {googlePending ? "Đang chuyển hướng…" : "Đăng nhập bằng Google"}
        </Button>
      </form>
    </div>
  )
}
