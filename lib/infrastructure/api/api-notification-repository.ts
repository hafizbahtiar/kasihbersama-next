import type { AppNotification } from "@/lib/domain/notification"
import type { NotificationRepository } from "@/lib/domain/notification-repository"
import type { Page } from "@/lib/domain/pagination"
import type { ApiClient } from "@/lib/infrastructure/api/client"
import type { PageResponse } from "@/lib/infrastructure/api/types"

type ApiNotification = {
  id: string
  category_key: string
  title: string
  body?: string
  circle_id?: string
  subject?: string
  created_at: string
  read_at?: string
  acknowledged_at?: string
}

function mapNotification(api: ApiNotification): AppNotification {
  return {
    id: api.id,
    categoryKey: api.category_key,
    title: api.title,
    body: api.body,
    circleId: api.circle_id,
    subject: api.subject,
    createdAt: api.created_at,
    readAt: api.read_at,
    acknowledgedAt: api.acknowledged_at,
  }
}

export class ApiNotificationRepository implements NotificationRepository {
  constructor(private readonly client: ApiClient) {}

  inbox(cursor?: string): Promise<Page<AppNotification>> {
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""
    return this.client
      .request<PageResponse<ApiNotification>>(`/notifications${query}`)
      .then((body) => ({
        data: (body.data ?? []).map(mapNotification),
        hasMore: body.meta?.has_more ?? false,
        nextCursor: body.meta?.next_cursor,
      }))
  }

  markRead(notificationId: string) {
    return this.client.request<void>(`/notifications/${notificationId}/read`, {
      method: "POST",
    })
  }

  acknowledge(notificationId: string) {
    return this.client.request<void>(
      `/notifications/${notificationId}/acknowledge`,
      { method: "POST" }
    )
  }
}
