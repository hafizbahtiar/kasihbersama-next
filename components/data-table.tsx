"use client"

import { type ReactNode } from "react"
import {
  IconChevronDown,
  IconChevronUp,
  IconSelector,
} from "@tabler/icons-react"
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_equalsString,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table"

import { DataTablePagination } from "@/components/data-table-pagination"
import {
  DataTableEmpty,
  DataTableToolbar,
  type DataTableFilter,
} from "@/components/data-table-toolbar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: {
    includesString: filterFn_includesString,
    equalsString: filterFn_equalsString,
  },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
  },
})

export type DataTableFeatures = typeof dataTableFeatures

export type DataTableColumnDef<
  TData extends RowData,
  TValue = unknown,
> = ColumnDef<DataTableFeatures, TData, TValue>

export function createDataTableColumnHelper<TData extends RowData>() {
  return createColumnHelper<DataTableFeatures, TData>()
}

interface DataTableProps<TData extends RowData> {
  columns: Array<ColumnDef<DataTableFeatures, TData, unknown>>
  data: TData[]
  emptyState?: ReactNode
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: ReactNode
  emptyAction?: ReactNode
  className?: string
  pageSize?: number
  paginate?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  filter?: DataTableFilter
  toolbarStart?: ReactNode
  toolbarActions?: ReactNode
  getRowId?: (originalRow: TData, index: number) => string
  isLoading?: boolean
  errorMessage?: string
  onRetry?: () => void
  manualPagination?: boolean
  pageIndex?: number
  pageCount?: number
  rowCount?: number
  onPageChange?: (pageIndex: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  emptyState,
  emptyTitle = "Tiada rekod",
  emptyDescription = "Tiada rekod untuk dipaparkan.",
  emptyIcon,
  emptyAction,
  className,
  pageSize = 5,
  paginate = true,
  searchable = false,
  searchPlaceholder = "Cari...",
  filter,
  toolbarStart,
  toolbarActions,
  getRowId,
  isLoading = false,
  errorMessage,
  onRetry,
  manualPagination = false,
  pageIndex: controlledPageIndex,
  pageCount: controlledPageCount,
  rowCount: controlledRowCount,
  onPageChange,
  onPageSizeChange,
}: DataTableProps<TData>) {
  const table = useTable(
    {
      features: dataTableFeatures,
      columns,
      data,
      getRowId,
      globalFilterFn: "includesString",
      initialState: {
        pagination: {
          pageIndex: controlledPageIndex ?? 0,
          pageSize: paginate ? pageSize : Number.POSITIVE_INFINITY,
        },
        globalFilter: "",
      },
    },
    (state) => ({
      sorting: state.sorting,
      pagination: state.pagination,
      globalFilter: state.globalFilter,
      columnFilters: state.columnFilters,
    })
  )

  if (
    manualPagination &&
    controlledPageIndex !== undefined &&
    table.state.pagination.pageIndex !== controlledPageIndex
  ) {
    table.setPageIndex(controlledPageIndex)
  }

  const rows = manualPagination
    ? table.getCoreRowModel().rows
    : table.getRowModel().rows
  const pageCount = manualPagination
    ? (controlledPageCount ?? 1)
    : table.getPageCount()
  const rowCount = manualPagination
    ? (controlledRowCount ?? data.length)
    : table.getRowCount()
  const from =
    rowCount === 0
      ? 0
      : table.state.pagination.pageIndex * table.state.pagination.pageSize + 1
  const to = Math.min(rowCount, from + rows.length - 1)
  const searchValue = String(table.state.globalFilter ?? "")
  const filterColumn = filter ? table.getColumn(filter.columnId) : undefined
  const filterValue = String(filterColumn?.getFilterValue() ?? "all")
  const hasActiveQuery =
    searchValue.trim().length > 0 ||
    (filterValue !== "" && filterValue !== "all")

  function resetQuery() {
    table.setGlobalFilter("")
    filterColumn?.setFilterValue(undefined)
    table.setPageIndex(0)
  }

  const sourceEmpty = data.length === 0 && !isLoading && !errorMessage

  const defaultEmpty = (
    <DataTableEmpty
      icon={emptyIcon}
      title={hasActiveQuery ? "Tiada rekod sepadan" : emptyTitle}
      description={
        hasActiveQuery
          ? "Cuba kata kunci lain atau kosongkan tapisan."
          : emptyDescription
      }
      action={
        hasActiveQuery ? (
          <Button variant="outline" onPress={resetQuery}>
            Kosongkan carian
          </Button>
        ) : (
          emptyAction
        )
      }
    />
  )

  return (
    <div className={cn("flex w-full flex-col gap-5", className)}>
      {toolbarStart}

      <div className="flex flex-col gap-3">
        <DataTableToolbar
          actions={toolbarActions}
          searchable={searchable && !sourceEmpty}
          searchPlaceholder={searchPlaceholder}
          searchValue={searchValue}
          onSearchChange={(value) => {
            table.setGlobalFilter(value)
            table.setPageIndex(0)
          }}
          filter={sourceEmpty ? undefined : filter}
          filterValue={filterValue}
          onFilterChange={(value) => {
            filterColumn?.setFilterValue(value === "all" ? undefined : value)
            table.setPageIndex(0)
          }}
        />

        <div
          className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <DataTableSkeleton columnCount={Math.max(columns.length, 4)} />
          ) : errorMessage ? (
            <DataTableEmpty
              title="Gagal memuatkan data"
              description={errorMessage}
              action={
                onRetry ? (
                  <Button variant="outline" onPress={onRetry}>
                    Cuba lagi
                  </Button>
                ) : undefined
              }
            />
          ) : sourceEmpty ? (
            (emptyState ?? defaultEmpty)
          ) : (
            <Table aria-label="Jadual data" selectionMode="none">
              <TableHeader>
                {table.getHeaderGroups().flatMap((headerGroup) =>
                  headerGroup.headers.map((header, headerIndex) => {
                    const sorted = header.column.getIsSorted()
                    const canSort = header.column.getCanSort()

                    return (
                      <TableHead
                        key={header.id}
                        id={header.id}
                        isRowHeader={headerIndex === 0}
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <Button
                            variant="ghost"
                            className="-ml-2 px-2 font-medium"
                            onPress={() => header.column.toggleSorting()}
                          >
                            <table.FlexRender header={header} />
                            {sorted === "asc" ? (
                              <IconChevronUp />
                            ) : sorted === "desc" ? (
                              <IconChevronDown />
                            ) : (
                              <IconSelector className="text-muted-foreground" />
                            )}
                          </Button>
                        ) : (
                          <table.FlexRender header={header} />
                        )}
                      </TableHead>
                    )
                  })
                )}
              </TableHeader>
              <TableBody
                className="data-empty:h-auto"
                renderEmptyState={() => defaultEmpty}
              >
                {rows.map((row) => (
                  <TableRow key={row.id} id={row.id}>
                    {row.getAllCells().map((cell) => (
                      <TableCell key={cell.id} id={cell.id}>
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {paginate && !isLoading && rowCount > 0 ? (
          <DataTablePagination
            pageIndex={table.state.pagination.pageIndex}
            pageCount={pageCount}
            pageSize={table.state.pagination.pageSize}
            rowCount={rowCount}
            from={from}
            to={to}
            canPreviousPage={table.getCanPreviousPage()}
            canNextPage={table.getCanNextPage()}
            onPageChange={(nextPage) => {
              if (manualPagination) {
                onPageChange?.(nextPage)
                return
              }
              table.setPageIndex(nextPage)
            }}
            onPageSizeChange={(nextSize) => {
              if (manualPagination) {
                onPageSizeChange?.(nextSize)
                return
              }
              table.setPageSize(nextSize)
              table.setPageIndex(0)
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

function DataTableSkeleton({ columnCount }: { columnCount: number }) {
  return (
    <div className="divide-y" aria-hidden="true">
      <div className="flex items-center gap-4 px-4 py-3">
        {Array.from({ length: columnCount }, (_, index) => (
          <Skeleton
            key={index}
            className="h-4"
            style={{ width: `${Math.max(12, 28 - index * 4)}%` }}
          />
        ))}
      </div>
      {Array.from({ length: 6 }, (_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 px-4 py-3">
          {Array.from({ length: columnCount }, (_, index) => (
            <Skeleton
              key={index}
              className="h-4"
              style={{ width: `${Math.max(10, 24 - index * 3)}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
