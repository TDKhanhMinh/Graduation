"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { verifySession } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getSafeNextPath } from "@/utils/url";
import { createDeletionSchedule } from "@/features/account/lifecycle";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const letterPattern = /[A-Za-z]/;
const numberPattern = /\d/;

export type AuthActionState = {
  error?: string;
  message?: string;
};

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!emailPattern.test(email)) {
    return { error: "Vui lòng nhập địa chỉ email hợp lệ." } as const;
  }

  if (
    password.length < 8 ||
    !letterPattern.test(password) ||
    !numberPattern.test(password)
  ) {
    return {
      error: "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ và số.",
    } as const;
  }

  return { email, password } as const;
}

export async function signIn(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const credentials = readCredentials(formData);

  if ("error" in credentials) {
    return { error: credentials.error };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    return {
      error: "Không thể đăng nhập. Vui lòng kiểm tra lại thông tin.",
    };
  }

  const next = getSafeNextPath(formData.get("next") as string | null);
  redirect(next);
}

export async function signInWithGoogle(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const next = getSafeNextPath(formData.get("next") as string | null);
  const callbackUrl = new URL("/auth/callback", getSiteUrl());
  callbackUrl.searchParams.set("next", next);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error || !data.url) {
    return {
      error: "Không thể bắt đầu đăng nhập bằng Google. Vui lòng thử lại sau.",
    };
  }

  redirect(data.url);
}

export async function signUp(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const credentials = readCredentials(formData);
  const displayName = String(formData.get("displayName") ?? "").trim();

  if ("error" in credentials) {
    return { error: credentials.error };
  }

  if (displayName.length < 2 || displayName.length > 100) {
    return { error: "Tên hiển thị phải có từ 2 đến 100 ký tự." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...credentials,
    options: {
      data: {
        display_name: displayName,
      },
      emailRedirectTo: `${getSiteUrl()}/auth/callback`,
    },
  });

  if (error) {
    return {
      error: "Không thể tạo tài khoản. Vui lòng thử lại sau.",
    };
  }

  if (!data.session) {
    return {
      message: "Đã tạo tài khoản. Hãy kiểm tra email để xác nhận đăng ký.",
    };
  }

  const next = getSafeNextPath(formData.get("next") as string | null);
  redirect(next);
}

export async function signOut() {
  const session = await verifySession();

  if (!session) {
    redirect("/auth/login");
  }

  const supabase = await createClient();
  // A dashboard logout should only end this browser session. Supabase's
  // default scope is global, which would also sign the user out on other
  // devices and tabs.
  await supabase.auth.signOut({ scope: "local" });
  revalidatePath("/", "layout");
  redirect("/auth/login");
}

export async function signOutAll() {
  const session = await verifySession();
  if (!session) redirect('/auth/login?next=/dashboard/privacy');

  const supabase = await createClient();
  await supabase.auth.signOut({ scope: 'global' });
  revalidatePath('/', 'layout');
  redirect('/auth/login?message=signed_out_all');
}

export async function requestAccountDeletion() {
  const session = await verifySession();
  if (!session) redirect('/auth/login?next=/dashboard/privacy');

  const admin = createAdminClient();
  const existing = await admin
    .from('account_deletion_requests')
    .select('id,status,scheduled_for')
    .eq('user_id', session.userId)
    .eq('status', 'cooling_off')
    .maybeSingle();

  if (existing.data) {
    redirect('/dashboard/privacy?deletion=already-scheduled');
  }

  const { error } = await admin
    .from('account_deletion_requests')
    .insert({
      user_id: session.userId,
      scheduled_for: createDeletionSchedule(new Date()),
    });

  if (error) {
    redirect('/dashboard/privacy?deletion=failed');
  }

  // A separate worker transaction must lock/soft-delete owned data before
  // purge. This request action intentionally does not perform broad mutation.
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: 'local' });
  revalidatePath('/', 'layout');
  redirect('/auth/login?message=account_deletion_requested');
}

function readSafeAvatarUrl(value: FormDataEntryValue | null): string | null {
  const raw = String(value ?? "").trim()
  if (!raw) return null
  if (raw.length > 2048) throw new Error("URL avatar không được dài quá 2048 ký tự.")

  try {
    const url = new URL(raw)
    if (url.protocol !== "https:" || url.username || url.password) {
      throw new Error("Avatar chỉ được dùng URL HTTPS an toàn.")
    }
    return url.toString()
  } catch (error) {
    if (error instanceof Error && error.message === "Avatar chỉ được dùng URL HTTPS an toàn.") throw error
    throw new Error("Avatar chỉ được dùng URL HTTPS hợp lệ.")
  }
}

export async function updateDisplayName(formData: FormData) {
  const session = await verifySession()

  if (!session) {
    redirect("/auth/login")
  }

  const displayName = String(formData.get("displayName") ?? "").trim()
  const avatarUrl = readSafeAvatarUrl(formData.get("avatarUrl"))

  if (displayName.length < 2 || displayName.length > 100) {
    throw new Error("Tên hiển thị phải có từ 2 đến 100 ký tự.")
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.userId)

  if (error) {
    throw new Error("Không thể cập nhật hồ sơ.")
  }

  revalidatePath("/")
}
