import type { BedStatus } from "@prisma/client";

export interface BedListQuery {
  page: number;
  limit: number;
  departmentId?: string;
  status?: BedStatus;
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

export interface BedDto {
  id: string;
  roomLabel: string;
  departmentId: string;
  departmentName: string;
  status: BedStatus;
  patientId: string | null;
  patientName: string | null;
}

export interface AssignBedInput {
  patientId: string;
}
