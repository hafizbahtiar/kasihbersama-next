"use client"

import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const DATA_TABLE_PAGE_SIZES = [5, 10, 20, 50] as const

export function getVisiblePages(
  currentPage: number,
  pageCount: number
): Array<number | "ellipsis"> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 5, "ellipsis", pageCount]
  }

  if (currentPage >= pageCount - 2) {
    return [
      1,
      "ellipsis",
      pageCount - 4,
      pageCount - 3,
      pageCount - 2,
      pageCount - 1,
      pageCount,
    ]
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    pageCount,
  ]
}

type DataTablePaginationProps = {
  pageIndex: number
  pageCount: number
  pageSize: number
  rowCount: number
  from: number
  to: number
  canPreviousPage: boolean
  canNextPage: boolean
  onPageChange: (pageIndex: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export function DataTablePagination({
  pageIndex,
  pageCount,
  pageSize,
  rowCount,
  from,
  to,
  canPreviousPage,
  canNextPage,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  const currentPage = pageIndex + 1
  const pages = getVisiblePages(currentPage, pageCount)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Menunjukkan {from}–{to} daripada {rowCount} rekod
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm whitespace-nowrap text-muted-foreground">
            Baris setiap halaman
          </span>
          <Select
            value={String(pageSize)}
            onChange={(key) => {
              const nextSize = Number(key)
              if (!Number.isNaN(nextSize)) {
                onPageSizeChange(nextSize)
              }
            }}
            aria-label="Baris setiap halaman"
          >
            <SelectTrigger size="sm" className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATA_TABLE_PAGE_SIZES.map((size) => (
                <SelectItem key={size} id={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Pagination className="mx-0 w-auto justify-start sm:justify-end">
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Halaman pertama"
                isDisabled={!canPreviousPage}
                onPress={() => onPageChange(0)}
              >
                <IconChevronsLeft />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Halaman sebelumnya"
                isDisabled={!canPreviousPage}
                onPress={() => onPageChange(pageIndex - 1)}
              >
                <IconChevronLeft data-icon="inline-start" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </Button>
            </PaginationItem>
            {pages.map((page, index) =>
              page === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <Button
                    variant={page === currentPage ? "outline" : "ghost"}
                    size="icon-sm"
                    aria-label={`Halaman ${page}`}
                    aria-current={page === currentPage ? "page" : undefined}
                    onPress={() => onPageChange(page - 1)}
                  >
                    {page}
                  </Button>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Halaman seterusnya"
                isDisabled={!canNextPage}
                onPress={() => onPageChange(pageIndex + 1)}
              >
                <span className="hidden sm:inline">Seterusnya</span>
                <IconChevronRight data-icon="inline-end" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Halaman terakhir"
                isDisabled={!canNextPage}
                onPress={() => onPageChange(pageCount - 1)}
              >
                <IconChevronsRight />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
