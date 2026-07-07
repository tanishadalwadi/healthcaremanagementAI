import type { PatientStatus, Priority } from "@prisma/client";

export interface NotificationListQuery {
  page: number;
  limit: number;
  userId?: string;
  read?: boolean;
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

export interface NotificationDto {
  id: string;
  patientId: string;
  userId: string | null;
  summary: string;
  read: boolean;
  createdAt: Date;
  patientName: string;
  room: string | null;
  patientStatus: PatientStatus;
  patientPriority: Priority;
}
