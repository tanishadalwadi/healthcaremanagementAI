import type { TaskStatus } from "@prisma/client";

export interface TaskListQuery {
  page: number;
  limit: number;
  search?: string;
  patientId?: string;
  assignedTo?: string;
  status?: TaskStatus;
}

export interface CreateTaskInput {
  patientId: string;
  title: string;
  description?: string | null;
  assignedTo: string;
  status?: TaskStatus;
  dueAt?: Date | null;
}

export type UpdateTaskInput = Partial<CreateTaskInput>;

export interface UpdateTaskStatusInput {
  status: TaskStatus;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PatientSummaryDto {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
}

export interface AssigneeSummaryDto {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface TaskSummaryDto {
  id: string;
  patientId: string;
  title: string;
  description: string | null;
  assignedTo: string;
  status: TaskStatus;
  dueAt: Date | null;
  completedAt: Date | null;
}

export interface TaskDetailDto extends TaskSummaryDto {
  patient: PatientSummaryDto;
  assignee: AssigneeSummaryDto;
}
