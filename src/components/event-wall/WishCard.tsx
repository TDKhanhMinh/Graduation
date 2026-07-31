import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { PublicWish } from "@/features/wishes/dal"

export function WishCard({ wish }: { wish: PublicWish }) {
  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${wish.is_pinned ? 'border-primary shadow-sm' : ''}`}>
      <CardHeader className="p-4 pb-2 flex flex-row items-center gap-3 space-y-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          {wish.sender_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-sm leading-none">{wish.sender_name}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(wish.created_at).toLocaleDateString("vi-VN", {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        {wish.is_pinned && (
          <div className="ml-auto flex items-center">
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">Ghim</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-sm whitespace-pre-wrap">{wish.content}</p>
      </CardContent>
    </Card>
  )
}
