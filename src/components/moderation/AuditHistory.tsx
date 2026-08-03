import { type AuditLog } from "@/features/wishes/moderation-dal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AuditHistory({ logs }: { logs: AuditLog[] }) {
  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Audit History</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No recent moderation actions.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Recent Audit History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="text-sm border-l-2 border-primary pl-4 py-1">
              <div className="font-medium text-foreground">
                Action: <span className="uppercase text-primary">{log.action}</span>
              </div>
              <div className="text-muted-foreground text-xs mt-1">
                {new Date(log.created_at).toLocaleString()}
                {log.wish_id && ` • Wish: ${log.wish_id.substring(0, 8)}...`}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
