import type { ConsultationStatus } from "@prisma/client";

export interface ConsultationListQuery {
  page: number;
  limit: number;
  search?: string;
  patientId?: string;
  doctorId?: string;
  departmentId?: string;
  status?: ConsultationStatus;
}

export interface CreateConsultationInput {
  patientId: string;
  doctorId: string;
  departmentId: string;
  reason: string;
  notes?: string | null;
  status?: ConsultationStatus;
  scheduledAt?: Date | null;
}

export type UpdateConsultationInput = Partial<
  Omit<CreateConsultationInput, "patientId">
> & {
  patientId?: string;
};

export interface UpdateConsultationStatusInput {
  status: ConsultationStatus;
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

export interface DepartmentSummaryDto {
  id: string;
  name: string;
  status: string;
}

export interface ConsultationSummaryDto {
  id: string;
  patientId: string;
  doctorId: string;
  departmentId: string;
  reason: string;
  notes: string | null;
  status: ConsultationStatus;
  scheduledAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  doctor: UserSummaryDto;
}

export interface ConsultationDetailDto extends ConsultationSummaryDto {
  patient: PatientSummaryDto;
  doctor: UserSummaryDto;
  department: DepartmentSummaryDto;
}
