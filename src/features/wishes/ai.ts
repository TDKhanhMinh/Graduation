import { createClient } from "@/lib/supabase/client"

export class GenerateAiWishError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message)
    this.name = "GenerateAiWishError"
  }
}

export async function requestAiSuggestions(
  eventId: string,
  prompt?: string,
  senderName?: string,
  relationship?: string
): Promise<string[]> {
  const supabase = createClient()
  const { data, error } = await supabase.functions.invoke("generate-ai-wish", {
    body: {
      event_id: eventId,
      prompt,
      sender_name: senderName,
      relationship,
    },
  })

  if (error) {
    throw new GenerateAiWishError(
      "Không thể tải gợi ý lúc này. Vui lòng thử lại sau.",
      error.status
    )
  }

  const { suggestions } = data as { suggestions: string[], fallback?: boolean }
  
  if (!suggestions || !Array.isArray(suggestions)) {
    throw new GenerateAiWishError("Dữ liệu gợi ý không hợp lệ")
  }

  return suggestions
}
