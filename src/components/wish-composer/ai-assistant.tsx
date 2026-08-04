"use client"

import { ChevronDown, ChevronUp, LoaderCircle, Sparkles } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requestAiSuggestions } from "@/features/wishes/ai"

type Props = {
  eventId: string
  draftSenderName: string
  onSuggestionSelect: (suggestion: string) => void
}

export function AiWishAssistant({ eventId, draftSenderName, onSuggestionSelect }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [relationship, setRelationship] = useState("")
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const results = await requestAiSuggestions(eventId, prompt, draftSenderName, relationship)
      setSuggestions(results)
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Đã xảy ra lỗi khi tạo gợi ý.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mb-4 w-full overflow-hidden rounded-xl border" aria-labelledby="ai-assistant-heading">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex min-h-(--control-min-size) w-full items-center justify-between gap-3 bg-muted/20 px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50"
        aria-expanded={isOpen}
        aria-controls="ai-assistant-panel"
      >
        <span className="flex items-center gap-2 text-primary">
          <Sparkles aria-hidden="true" className="size-4" />
          <span id="ai-assistant-heading">Trợ lý viết lời chúc AI</span>
        </span>
        {isOpen ? <ChevronUp aria-hidden="true" className="size-4 text-muted-foreground" /> : <ChevronDown aria-hidden="true" className="size-4 text-muted-foreground" />}
      </button>

      {isOpen ? (
        <div id="ai-assistant-panel" className="space-y-4 border-t bg-muted/10 p-4">
          <div className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="ai-prompt">Ý chính hoặc lời nhắn nhủ (tùy chọn)</Label>
              <Input
                id="ai-prompt"
                placeholder="Ví dụ: Chúc mạnh khỏe, thành công…"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ai-relationship">Mối quan hệ với người nhận (tùy chọn)</Label>
              <Input
                id="ai-relationship"
                placeholder="Ví dụ: Bạn thân, đồng nghiệp…"
                value={relationship}
                onChange={(event) => setRelationship(event.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleGenerate()}
              disabled={loading}
              aria-busy={loading}
              className="min-h-(--control-min-size) w-full"
            >
              {loading ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <Sparkles aria-hidden="true" />}
              {loading ? "Đang tạo gợi ý…" : "Tạo gợi ý mới"}
            </Button>
          </div>

          {error ? <p className="text-sm text-status-danger" role="alert">{error}</p> : null}
          {loading ? (
            <p className="text-sm text-muted-foreground" role="status" aria-live="polite">Trợ lý đang chuẩn bị gợi ý…</p>
          ) : null}

          {suggestions.length > 0 ? (
            <div className="space-y-2" role="region" aria-label="Kết quả gợi ý">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Các gợi ý</p>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onSuggestionSelect(suggestion)}
                  className="min-h-(--control-min-size) w-full rounded-lg border bg-background p-3 text-left text-sm transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}