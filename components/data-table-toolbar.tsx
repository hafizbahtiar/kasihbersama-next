"use client"

import type { ReactNode } from "react"
import { IconSearch } from "@tabler/icons-react"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type DataTableFilterOption = {
  label: string
  value: string
}

export type DataTableFilter = {
  columnId: string
  label: string
  options: DataTableFilterOption[]
}

export function DataTableToolbar({
  actions,
  searchable,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filter,
  filterValue,
  onFilterChange,
}: {
  actions?: ReactNode
  searchable?: boolean
  searchPlaceholder: string
  searchValue: string
  onSearchChange: (value: string) => void
  filter?: DataTableFilter
  filterValue: string
  onFilterChange: (value: string) => void
}) {
  const hasControls = searchable || filter || actions

  if (!hasControls) {
    return null
  }

  return (
    <div className="flex flex-col flex-wrap items-stretch gap-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {searchable ? (
          <InputGroup
            className="max-w-md min-w-0 flex-1 sm:max-w-xs"
            aria-label="Cari dalam jadual"
          >
            <InputGroupAddon>
              <IconSearch />
            </InputGroupAddon>
            <InputGroupInput
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(event) =>
                onSearchChange(
                  typeof event === "string" ? event : event.target.value
                )
              }
            />
          </InputGroup>
        ) : null}

        {filter ? (
          <Select
            className="w-[8.5rem] shrink-0 sm:w-40"
            value={filterValue}
            onChange={(key) => onFilterChange(String(key ?? "all"))}
            aria-label={filter.label}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem id="all">{`Semua ${filter.label.toLowerCase()}`}</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} id={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}

export function DataTableEmpty({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <Empty className="border-0 py-10">
      <EmptyHeader>
        {icon ? <EmptyMedia variant="icon">{icon}</EmptyMedia> : null}
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  )
}
