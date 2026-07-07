import type { AmbulanceStatus } from "@prisma/client";

export interface AmbulanceListQuery {
  page: number;
  limit: number;
  status?: AmbulanceStatus;
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

export interface AmbulanceDto {
  id: string;
  unitLabel: string;
  label: string;
  status: AmbulanceStatus;
}

export interface UpdateAmbulanceStatusInput {
  status: AmbulanceStatus;
}
