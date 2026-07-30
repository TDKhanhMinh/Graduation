"use client"

import { useActionState } from "react"

import type { AuthActionState } from "@/app/auth/actions"

type AuthAction = (
  state: AuthActionState,
  formData: FormData
) => Promise<AuthActionState>

type AuthFormProps = {
  action: AuthAction
  mode: "sign-in" | "sign-up"
}

const initialState: AuthActionState = {}

export function AuthForm({ action, mode }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const isSignUp = mode === "sign-up"

  return (
    <form action={formAction} className="space-y-5">
      {isSignUp ? (
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-zinc-800"
            htmlFor="displayName"
          >
            Tên hiển thị
          </label>
          <input
            autoComplete="name"
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
            id="displayName"
            maxLength={100}
            minLength={2}
            name="displayName"
            required
            type="text"
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-800" htmlFor="email">
          Email
        </label>
        <input
          autoComplete="email"
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
          id="email"
          name="email"
          required
          type="email"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-800" htmlFor="password">
          Mật khẩu
        </label>
        <input
          autoComplete={isSignUp ? "new-password" : "current-password"}
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
          id="password"
          minLength={8}
          name="password"
          required
          type="password"
        />
        {isSignUp ? (
          <p className="text-xs leading-5 text-zinc-500">
            Ít nhất 8 ký tự, gồm chữ và số.
          </p>
        ) : null}
      </div>

      {state.error ? (
        <p
          className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      {state.message ? (
        <p
          className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <button
        className="h-11 w-full rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending
          ? "Đang xử lý..."
          : isSignUp
            ? "Tạo tài khoản"
            : "Đăng nhập"}
      </button>
    </form>
  )
}
