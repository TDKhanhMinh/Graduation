import { Button } from "@/components/ui/button"
import { type ModerationAction } from "@/features/wishes/moderation-schema"
import { CheckCircle, XCircle, EyeOff, Pin, Trash2, X } from "lucide-react"

export function BulkActionBar({
  selectedCount,
  isPending,
  onAction,
  onClear,
}: {
  selectedCount: number
  isPending: boolean
  onAction: (action: ModerationAction) => void
  onClear: () => void
}) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground border shadow-lg rounded-full px-6 py-3 flex items-center gap-4 z-50">
      <div className="text-sm font-medium mr-2">
        {selectedCount} selected
      </div>
      
      <div className="flex items-center gap-2 border-l pl-4">
        <Button 
          variant="ghost" 
          size="sm" 
          disabled={isPending}
          onClick={() => onAction("approve")}
          className="text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Approve
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          disabled={isPending}
          onClick={() => onAction("reject")}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Reject
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          disabled={isPending}
          onClick={() => onAction("hide")}
        >
          <EyeOff className="w-4 h-4 mr-2" />
          Hide
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          disabled={isPending}
          onClick={() => onAction("pin")}
        >
          <Pin className="w-4 h-4 mr-2" />
          Pin
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          disabled={isPending}
          onClick={() => onAction("soft_delete")}
          className="text-muted-foreground"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>

      <div className="border-l pl-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          disabled={isPending}
          className="h-8 w-8 rounded-full"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
