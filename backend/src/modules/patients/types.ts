import type { Gender, PatientStatus, Priority } from "@prisma/client";

export interface PatientListQuery {
  page: number;
  limit: number;
  search?: string;
  department?: string;
  status?: PatientStatus;
  excludeStatus?: PatientStatus;
  priority?: Priority;
  assignedNurseId?: string;
  assignedDoctorId?: string;
}

export interface CreatePatientInput {
  patientNumber: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: Gender;
  room?: string | null;
  diagnosis?: string | null;
  departmentId: string;
  status?: PatientStatus;
  priority?: Priority;
  assignedNurseId?: string | null;
  assignedDoctorId?: string | null;
  dischargeRequestedAt?: Date | null;
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
  diagnosis: string | null;
  status: PatientStatus;
  priority: Priority;
  departmentId: string;
  assignedNurseId: string | null;
  assignedDoctorId: string | null;
  dischargeRequestedAt: Date | null;
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

export interface WorkflowEventDto {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  sequence: number;
  status: string;
  occurredAt: Date;
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
  workflowEvents: WorkflowEventDto[];
  tasks: TaskDto[];
  events: PatientEventDto[];
}
