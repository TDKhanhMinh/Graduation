export type SubmitWishInput = {
  eventId: string
  clientRequestId: string
  senderName: string
  content: string
  captchaToken: string
  deviceKey: string
  mediaPath?: string
  senderAvatarPath?: string
}

export type SubmitWishResult = {
  wishId: string
  status: "approved" | "pending"
  duplicate: boolean
  message: string
  requestId: string
}

type ErrorPayload = {
  error?: {
    code?: string
    message?: string
    details?: {
      retryable?: boolean
      retryAfterSeconds?: number
    }
  }
}

export class SubmitWishError extends Error {
  readonly code: string
  readonly status: number
  readonly retryable: boolean
  readonly retryAfterSeconds?: number

  constructor(
    message: string,
    {
      code,
      status,
      retryable = false,
      retryAfterSeconds,
    }: {
      code: string
      status: number
      retryable?: boolean
      retryAfterSeconds?: number
    }
  ) {
    super(message)
    this.name = "SubmitWishError"
    this.code = code
    this.status = status
    this.retryable = retryable
    this.retryAfterSeconds = retryAfterSeconds
  }
}

const readJson = async (response: Response) => {
  try {
    return (await response.json()) as SubmitWishResult | ErrorPayload
  } catch {
    return {}
  }
}

export async function submitWish(
  input: SubmitWishInput,
  fetcher: typeof fetch = fetch
): Promise<SubmitWishResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    throw new SubmitWishError("Dịch vụ gửi lời chúc chưa được cấu hình.", {
      code: "CLIENT_CONFIG_ERROR",
      status: 0,
    })
  }

  let response: Response
  try {
    response = await fetcher(`${supabaseUrl}/functions/v1/submit-wish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": input.clientRequestId,
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    throw new SubmitWishError(
      "Không thể kết nối. Bản nháp vẫn được giữ để bạn thử lại.",
      {
        code: "NETWORK_ERROR",
        status: 0,
        retryable: true,
      }
    )
  }

  const payload = await readJson(response)
  if (!response.ok) {
    const error = "error" in payload ? payload.error : undefined
    throw new SubmitWishError(
      error?.message ?? "Không thể gửi lời chúc lúc này.",
      {
        code: error?.code ?? "UNKNOWN_ERROR",
        status: response.status,
        retryable: error?.details?.retryable ?? response.status >= 500,
        retryAfterSeconds: error?.details?.retryAfterSeconds,
      }
    )
  }

  if (
    !("wishId" in payload) ||
    !payload.wishId ||
    (payload.status !== "approved" && payload.status !== "pending")
  ) {
    throw new SubmitWishError("Phản hồi từ máy chủ không hợp lệ.", {
      code: "INVALID_RESPONSE",
      status: response.status,
      retryable: true,
    })
  }

  return payload
}
