import { type ModerationWish } from "@/features/wishes/moderation-dal"
import { Checkbox } from "@/components/ui/checkbox"
import { ModerationMediaPreview } from "./ModerationMediaPreview"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function ModerationQueue({
  wishes,
  selectedIds,
  onSelectAll,
  onSelect,
}: {
  wishes: ModerationWish[]
  selectedIds: string[]
  onSelectAll: (checked: boolean) => void
  onSelect: (id: string, checked: boolean) => void
}) {
  const isAllSelected = wishes.length > 0 && selectedIds.length === wishes.length

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox 
                checked={isAllSelected} 
                onCheckedChange={onSelectAll} 
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Sender</TableHead>
            <TableHead>Content</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {wishes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                No wishes found.
              </TableCell>
            </TableRow>
          ) : (
            wishes.map((wish) => (
              <TableRow key={wish.id}>
                <TableCell>
                  <Checkbox 
                    checked={selectedIds.includes(wish.id)}
                    onCheckedChange={(c) => onSelect(wish.id, !!c)}
                    aria-label={`Select wish from ${wish.sender_name}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{wish.sender_name}</TableCell>
                <TableCell className="max-w-xs" title={wish.content || ""}>
                  <div className="truncate">
                    {wish.content || <span className="italic text-muted-foreground">No content</span>}
                  </div>
                  {wish.media && <ModerationMediaPreview media={wish.media} />}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    wish.moderation_status === 'approved' ? 'bg-green-100 text-green-800' :
                    wish.moderation_status === 'rejected' ? 'bg-red-100 text-red-800' :
                    wish.moderation_status === 'hidden' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {wish.moderation_status}
                  </span>
                  {wish.is_pinned && <span className="ml-2 text-xs text-blue-600">📌 Pinned</span>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(wish.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
