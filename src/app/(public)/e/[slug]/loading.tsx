export default function Loading() {
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="bg-background border-b h-[73px] flex items-center px-4">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-10 bg-muted animate-pulse rounded" />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden h-[150px] flex flex-col p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-muted rounded-full shrink-0" />
                <div className="space-y-2 w-full">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-4/5 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
