"use client"

import { useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/ui/status-badge"

export function ModerationFilters({
  currentStatus,
  currentSearch,
  currentDateFrom,
  currentDateTo,
  onFilterChange,
  onClearFilters,
}: {
  currentStatus: string
  currentSearch: string
  currentDateFrom: string
  currentDateTo: string
  onFilterChange: (key: string, value: string) => void
  onClearFilters: () => void
}) {
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasFilters = Boolean(currentStatus || currentSearch || currentDateFrom || currentDateTo)

  useEffect(() => () => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
  }, [])

  return (
    <fieldset className="space-y-4 rounded-xl border bg-surface-sunken/50 p-4">
      <legend className="sr-only">Bộ lọc kiểm duyệt</legend>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_12rem_12rem_12rem_auto] lg:items-end">
        <div className="grid min-w-0 gap-2">
          <Label htmlFor="moderation-search">Tìm kiếm</Label>
          <Input
            id="moderation-search"
            type="search"
            placeholder="Tên người gửi hoặc nội dung…"
            value={currentSearch}
            onChange={(event) => {
              const value = event.target.value
              if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
              searchTimeoutRef.current = setTimeout(() => onFilterChange("search", value), 300)
            }}
            className="min-h-(--control-min-size)"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="moderation-status">Trạng thái</Label>
          <Select
            value={currentStatus || "all"}
            onValueChange={(value: string | null) => onFilterChange("status", value === "all" || !value ? "" : value)}
          >
            <SelectTrigger id="moderation-status" className="min-h-(--control-min-size) w-full">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="approved">Đã duyệt</SelectItem>
              <SelectItem value="rejected">Từ chối</SelectItem>
              <SelectItem value="hidden">Đã ẩn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="moderation-date-from">Từ ngày</Label>
          <Input
            id="moderation-date-from"
            type="date"
            value={currentDateFrom}
            onChange={(event) => onFilterChange("dateFrom", event.target.value)}
            className="min-h-(--control-min-size)"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="moderation-date-to">Đến ngày</Label>
          <Input
            id="moderation-date-to"
            type="date"
            value={currentDateTo}
            onChange={(event) => onFilterChange("dateTo", event.target.value)}
            className="min-h-(--control-min-size)"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onClearFilters}
          disabled={!hasFilters}
          className="min-h-(--control-min-size)"
        >
          Xóa lọc
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2" aria-live="polite">
        <span className="text-xs text-muted-foreground">Đang lọc:</span>
        {hasFilters ? (
          <>
            {currentStatus ? <StatusBadge tone="info">Trạng thái: {currentStatus}</StatusBadge> : null}
            {currentSearch ? <StatusBadge>Từ khóa: {currentSearch}</StatusBadge> : null}
            {currentDateFrom ? <StatusBadge>Từ {currentDateFrom}</StatusBadge> : null}
            {currentDateTo ? <StatusBadge>Đến {currentDateTo}</StatusBadge> : null}
          </>
        ) : (
          <StatusBadge>Không có bộ lọc</StatusBadge>
        )}
      </div>
    </fieldset>
  )
}