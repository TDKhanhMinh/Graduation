"use client"

import { useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ModerationFilters({
  currentStatus,
  currentSearch,
  currentDateFrom,
  currentDateTo,
  onFilterChange,
}: {
  currentStatus: string
  currentSearch: string
  currentDateFrom: string
  currentDateTo: string
  onFilterChange: (key: string, value: string) => void
}) {
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
  }, [])

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4">
      <div className="flex-1">
        <Input
          type="search"
          placeholder="Search by sender or content..."
          defaultValue={currentSearch}
          onChange={(e) => {
            const val = e.target.value
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
            searchTimeoutRef.current = setTimeout(() => onFilterChange("search", val), 300)
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

      <Input
        type="date"
        aria-label="Filter from date"
        value={currentDateFrom}
        onChange={(event) => onFilterChange("dateFrom", event.target.value)}
        className="sm:w-[170px]"
      />
      <Input
        type="date"
        aria-label="Filter to date"
        value={currentDateTo}
        onChange={(event) => onFilterChange("dateTo", event.target.value)}
        className="sm:w-[170px]"
      />
    </div>
  )
}
