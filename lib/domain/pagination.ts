/**
 * One page of a cursor-paginated list (docs/00 §6.1).
 *
 * Cursor, not page number: the lists here are ordered by time and grow at the
 * head, so a page number would shift under the reader between two requests.
 * `nextCursor` is opaque - it is passed back untouched, never parsed.
 */
export type Page<T> = {
  data: T[]
  hasMore: boolean
  nextCursor?: string
}
