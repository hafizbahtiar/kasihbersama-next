"use client"

import type { ReactNode } from "react"
import { IconColumns3, IconPlus, IconSearch } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

/** One hideable column, flattened so the toolbar never touches table generics. */
export type DataTableColumnToggle = {
  id: string
  label: string
  isVisible: boolean
  toggle: () => void
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
  columnToggles,
  addLabel,
  onAdd,
}: {
  actions?: ReactNode
  searchable?: boolean
  searchPlaceholder: string
  searchValue: string
  onSearchChange: (value: string) => void
  filter?: DataTableFilter
  filterValue: string
  onFilterChange: (value: string) => void
  columnToggles?: DataTableColumnToggle[]
  addLabel?: string
  onAdd?: () => void
}) {
  const hasToggles = Boolean(columnToggles && columnToggles.length > 0)
  const hasControls =
    searchable || filter || actions || hasToggles || Boolean(onAdd)

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

      {/* Kanan, sebaris dengan medan carian: kawalan jadual (lajur) dan tindakan
          utama (tambah) tinggal bersama supaya setiap jadual dalam app ini
          meletakkannya di tempat yang sama. */}
      {hasToggles || onAdd || actions ? (
        <ButtonGroup className="justify-end">
          {actions}
          {hasToggles ? (
            <DropdownMenuTrigger>
              <Button variant="outline" size="sm">
                <IconColumns3 />
                Lajur
              </Button>
              <DropdownMenu
                placement="bottom end"
                selectionMode="multiple"
                selectedKeys={(columnToggles ?? [])
                  .filter((column) => column.isVisible)
                  .map((column) => column.id)}
                onSelectionChange={() => {
                  // Tidak digunakan: setiap item menogol lajurnya sendiri dalam
                  // onAction, supaya menu tidak perlu memiliki keadaan itu.
                }}
              >
                <DropdownMenuLabel>Papar lajur</DropdownMenuLabel>
                {(columnToggles ?? []).map((column) => (
                  <DropdownMenuItem
                    key={column.id}
                    id={column.id}
                    onAction={column.toggle}
                  >
                    {column.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenu>
            </DropdownMenuTrigger>
          ) : null}
          {onAdd ? (
            <Button size="sm" onPress={onAdd}>
              <IconPlus />
              {addLabel ?? "Tambah"}
            </Button>
          ) : null}
        </ButtonGroup>
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
