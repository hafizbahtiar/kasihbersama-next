import type { Task, TaskInput, TaskStatus } from "@/lib/domain/task"

export interface TaskRepository {
  listTasks(
    circleId: string,
    filter?: { includeCancelled?: boolean }
  ): Promise<Task[]>
  /** Satu tugasan bersama senarai semaknya. */
  getTask(circleId: string, taskId: string): Promise<Task>
  createTask(circleId: string, input: TaskInput): Promise<void>
  updateTask(circleId: string, taskId: string, input: TaskInput): Promise<void>
  /** Penerima sentiasa boleh menggerakkan tugasannya sendiri. */
  setStatus(circleId: string, taskId: string, status: TaskStatus): Promise<void>
  deleteTask(circleId: string, taskId: string): Promise<void>
  addChecklistItem(
    circleId: string,
    taskId: string,
    label: string
  ): Promise<Task>
  setChecklistItem(
    circleId: string,
    taskId: string,
    itemId: string,
    isDone: boolean
  ): Promise<Task>
  deleteChecklistItem(
    circleId: string,
    taskId: string,
    itemId: string
  ): Promise<Task>
}
