import type { Prisma, PrismaClient } from "@prisma/client";
import type { NotificationListQuery } from "./types.js";

const notificationSelect = {
  id: true,
  patientId: true,
  userId: true,
  summary: true,
  read: true,
  createdAt: true,
  patient: {
    select: {
      firstName: true,
      lastName: true,
      room: true,
      status: true,
      priority: true,
      assignedNurseId: true,
      assignedDoctorId: true,
      deletedAt: true,
    },
  },
} satisfies Prisma.NotificationSelect;

export type NotificationRecord = Prisma.NotificationGetPayload<{
  select: typeof notificationSelect;
}>;

export class NotificationRepository {
  constructor(private readonly db: PrismaClient) {}

  async findMany(query: NotificationListQuery, where: Prisma.NotificationWhereInput) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await this.db.$transaction([
      this.db.notification.findMany({
        where,
        select: notificationSelect,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.db.notification.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<NotificationRecord | null> {
    return this.db.notification.findUnique({
      where: { id },
      select: notificationSelect,
    });
  }

  async markRead(id: string): Promise<NotificationRecord | null> {
    try {
      return await this.db.notification.update({
        where: { id },
        data: { read: true },
        select: notificationSelect,
      });
    } catch {
      return null;
    }
  }

  async findUserById(userId: string) {
    return this.db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
  }
}
