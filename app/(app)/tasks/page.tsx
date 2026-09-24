import type { Metadata } from "next"

import { TasksPage } from "@/components/tasks/tasks-page"

export const metadata: Metadata = {
  title: "Tugasan",
}

export default function TasksRoutePage() {
  return <TasksPage />
}
