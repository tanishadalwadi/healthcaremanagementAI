import type { DepartmentStatus } from "@prisma/client";

export interface DepartmentListQuery {
  page: number;
  limit: number;
  search?: string;
  status?: DepartmentStatus;
}

export interface CreateDepartmentInput {
  name: string;
  status?: DepartmentStatus;
}

export type UpdateDepartmentInput = Partial<CreateDepartmentInput>;

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DepartmentSummaryDto {
  id: string;
  name: string;
  status: DepartmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartmentDetailDto extends DepartmentSummaryDto {
  patientCount: number;
}
