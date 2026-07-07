import type { UserRole } from "@prisma/client";

export interface UserListQuery {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
}

export interface CreateUserInput {
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string | null;
}

export type UpdateUserInput = Partial<CreateUserInput>;

export interface UpdateUserStatusInput {
  active: boolean;
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

export interface DepartmentSummaryDto {
  id: string;
  name: string;
  status: string;
}

export interface UserSummaryDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDetailDto extends UserSummaryDto {
  department: DepartmentSummaryDto | null;
  assignedPatientsCount: number;
}
