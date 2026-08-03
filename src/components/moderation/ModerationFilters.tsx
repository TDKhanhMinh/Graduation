"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ModerationFilters({
  currentStatus,
  currentSearch,
  onFilterChange,
}: {
  currentStatus: string
  currentSearch: string
  onFilterChange: (key: string, value: string) => void
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4">
      <div className="flex-1">
        <Input
          type="search"
          placeholder="Search by sender or content..."
          defaultValue={currentSearch}
          onChange={(e) => {
            const val = e.target.value
            // Simple debounce can be added here if needed
            const timeoutId = setTimeout(() => onFilterChange("search", val), 300)
            return () => clearTimeout(timeoutId)
          }}
          className="max-w-sm"
        />
      </div>
      
      <Select
        value={currentStatus || "all"}
        onValueChange={(val: string | null) => onFilterChange("status", val === "all" || !val ? "" : val)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="hidden">Hidden</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
