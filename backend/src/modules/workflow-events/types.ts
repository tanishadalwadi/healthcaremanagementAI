import type { WorkflowEventStatus, WorkflowEventType } from "@prisma/client";

export interface WorkflowEventListQuery {
  page: number;
  limit: number;
  search?: string;
  patientId?: string;
  status?: WorkflowEventStatus;
  eventType?: WorkflowEventType;
}

export interface CreateWorkflowEventInput {
  patientId: string;
  title: string;
  description?: string | null;
  eventType: WorkflowEventType;
  status?: WorkflowEventStatus;
  sequence: number;
  createdBy?: string | null;
  occurredAt?: Date;
}

export type UpdateWorkflowEventInput = Partial<CreateWorkflowEventInput>;

export interface UpdateWorkflowEventStatusInput {
  status: WorkflowEventStatus;
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

export interface UserSummaryDto {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface WorkflowEventSummaryDto {
  id: string;
  patientId: string;
  title: string;
  description: string | null;
  eventType: WorkflowEventType;
  status: WorkflowEventStatus;
  sequence: number;
  createdBy: string | null;
  occurredAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowEventDetailDto extends WorkflowEventSummaryDto {
  patient: PatientSummaryDto;
  creator: UserSummaryDto | null;
}
