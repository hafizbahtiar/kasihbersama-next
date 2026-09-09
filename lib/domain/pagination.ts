export type ListParams = {
  page?: number
  perPage?: number
  sort?: string
  filter?: Record<string, string>
}

export type PaginatedResult<T> = {
  data: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
  hasMore: boolean
}
