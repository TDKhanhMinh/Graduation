"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requestAiSuggestions } from "@/features/wishes/ai"
import { ChevronDown, ChevronUp, Loader2, Sparkles } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function AiWishAssistant({
  eventId,
  draftSenderName,
  onSuggestionSelect,
}: {
  eventId: string
  draftSenderName: string
  onSuggestionSelect: (suggestion: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [relationship, setRelationship] = useState("")
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const handleGenerate = async () => {
    setLoading(true)
    try {
      const results = await requestAiSuggestions(eventId, prompt, draftSenderName, relationship)
      setSuggestions(results)
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Đã xảy ra lỗi."
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full mb-4 border rounded-xl overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/40 transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" />
          Trợ lý viết lời chúc AI
        </span>
        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      
      {isOpen && (
        <div className="p-4 border-t bg-muted/10 space-y-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="ai-prompt" className="text-xs text-muted-foreground mb-1 block">Ý chính / Lời nhắn nhủ (Tùy chọn)</Label>
              <Input
                id="ai-prompt"
                placeholder="Ví dụ: Chúc mạnh khỏe, thành công..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label htmlFor="ai-relationship" className="text-xs text-muted-foreground mb-1 block">Mối quan hệ với người nhận (Tùy chọn)</Label>
              <Input
                id="ai-relationship"
                placeholder="Ví dụ: Bạn thân, Đồng nghiệp..."
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="h-9"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full mt-2"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo gợi ý...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Tạo gợi ý mới
                </>
              )}
            </Button>
          </div>
          {suggestions.length > 0 && (
            <div className="space-y-2 mt-4" role="region" aria-label="Kết quả gợi ý">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Các gợi ý:</p>
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSuggestionSelect(suggestion)}
                  className="w-full text-left rounded-lg border bg-background p-3 text-sm hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
