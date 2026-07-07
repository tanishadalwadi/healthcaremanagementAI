import { BadRequestError, NotFoundError } from "../../errors/app-error.js";
import type { NotificationRecord, NotificationRepository } from "./repository.js";
import type {
  NotificationDto,
  NotificationListQuery,
  PaginatedResult,
} from "./types.js";

function toDto(record: NotificationRecord): NotificationDto {
  return {
    id: record.id,
    patientId: record.patientId,
    userId: record.userId,
    summary: record.summary,
    read: record.read,
    createdAt: record.createdAt,
    patientName: `${record.patient.firstName} ${record.patient.lastName}`,
    room: record.patient.room,
    patientStatus: record.patient.status,
    patientPriority: record.patient.priority,
  };
}

export class NotificationService {
  constructor(private readonly repository: NotificationRepository) {}

  async listNotifications(
    query: NotificationListQuery,
  ): Promise<PaginatedResult<NotificationDto>> {
    const where = await this.buildWhereClause(query);
    const { items, total } = await this.repository.findMany(query, where);
    const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);

    return {
      items: items.map(toDto),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  async markRead(id: string): Promise<NotificationDto> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError(`Notification with id "${id}" was not found`);
    }

    const updated = await this.repository.markRead(id);

    if (!updated) {
      throw new NotFoundError(`Notification with id "${id}" was not found`);
    }

    return toDto(updated);
  }

  private async buildWhereClause(
    query: NotificationListQuery,
  ): Promise<import("@prisma/client").Prisma.NotificationWhereInput> {
    const where: import("@prisma/client").Prisma.NotificationWhereInput = {
      patient: { deletedAt: null },
      ...(query.read !== undefined ? { read: query.read } : {}),
    };

    if (!query.userId) {
      return where;
    }

    const user = await this.repository.findUserById(query.userId);

    if (!user) {
      throw new NotFoundError(`User with id "${query.userId}" was not found`);
    }

    if (user.role === "ADMIN") {
      return where;
    }

    if (user.role === "NURSE") {
      return {
        ...where,
        OR: [
          { userId: query.userId },
          { patient: { assignedNurseId: query.userId, deletedAt: null } },
        ],
      };
    }

    if (user.role === "DOCTOR") {
      return {
        ...where,
        OR: [
          { userId: query.userId },
          { patient: { assignedDoctorId: query.userId, deletedAt: null } },
        ],
      };
    }

    throw new BadRequestError(
      `Notifications cannot be listed for user role "${user.role}"`,
    );
  }
}
