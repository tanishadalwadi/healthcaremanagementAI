import type { Gender, PatientStatus, Priority } from "@prisma/client";

export interface PatientListQuery {
  page: number;
  limit: number;
  search?: string;
  department?: string;
  status?: PatientStatus;
  priority?: Priority;
}

export interface CreatePatientInput {
  patientNumber: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: Gender;
  room?: string | null;
  departmentId: string;
  status?: PatientStatus;
  priority?: Priority;
  assignedNurseId?: string | null;
  assignedDoctorId?: string | null;
}

export type UpdatePatientInput = Partial<CreatePatientInput>;

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
  age: number;
  gender: Gender;
  room: string | null;
  status: PatientStatus;
  priority: Priority;
  departmentId: string;
  assignedNurseId: string | null;
  assignedDoctorId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartmentDto {
  id: string;
  name: string;
  status: string;
}

export interface UserSummaryDto {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface WorkflowStepDto {
  id: string;
  stepName: string;
  order: number;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface TaskDto {
  id: string;
  title: string;
  description: string | null;
  assignedTo: string;
  status: string;
  dueAt: Date | null;
  completedAt: Date | null;
}

export interface PatientEventDto {
  id: string;
  eventType: string;
  description: string;
  createdBy: string;
  timestamp: Date;
}

export interface PatientDetailDto extends PatientSummaryDto {
  department: DepartmentDto;
  assignedNurse: UserSummaryDto | null;
  assignedDoctor: UserSummaryDto | null;
  workflowSteps: WorkflowStepDto[];
  tasks: TaskDto[];
  events: PatientEventDto[];
}
