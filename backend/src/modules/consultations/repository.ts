import type { ConsultationStatus, Prisma, PrismaClient } from "@prisma/client";
import type {
  ConsultationListQuery,
  CreateConsultationInput,
  UpdateConsultationInput,
  UpdateConsultationStatusInput,
} from "./types.js";

const consultationSummarySelect = {
  id: true,
  patientId: true,
  doctorId: true,
  departmentId: true,
  reason: true,
  notes: true,
  status: true,
  scheduledAt: true,
  startedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ConsultationSelect;

const consultationDetailInclude = {
  patient: {
    select: {
      id: true,
      patientNumber: true,
      firstName: true,
      lastName: true,
    },
  },
  doctor: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  department: {
    select: {
      id: true,
      name: true,
      status: true,
    },
  },
} satisfies Prisma.ConsultationInclude;

export type ConsultationSummaryRecord = Prisma.ConsultationGetPayload<{
  select: typeof consultationSummarySelect;
}>;

export type ConsultationDetailRecord = Prisma.ConsultationGetPayload<{
  include: typeof consultationDetailInclude;
}>;

export class ConsultationRepository {
  constructor(private readonly db: PrismaClient) {}

  async findMany(query: ConsultationListQuery) {
    const { page, limit, search, patientId, doctorId, departmentId, status } =
      query;
    const skip = (page - 1) * limit;

    const where: Prisma.ConsultationWhereInput = {
      ...(patientId ? { patientId } : {}),
      ...(doctorId ? { doctorId } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { reason: { contains: search, mode: "insensitive" } },
              {
                patient: {
                  firstName: { contains: search, mode: "insensitive" },
                },
              },
              {
                patient: {
                  lastName: { contains: search, mode: "insensitive" },
                },
              },
              {
                patient: {
                  patientNumber: { contains: search, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await this.db.$transaction([
      this.db.consultation.findMany({
        where,
        select: consultationSummarySelect,
        skip,
        take: limit,
        orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
      }),
      this.db.consultation.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<ConsultationDetailRecord | null> {
    return this.db.consultation.findUnique({
      where: { id },
      include: consultationDetailInclude,
    });
  }

  async create(
    data: CreateConsultationInput,
  ): Promise<ConsultationSummaryRecord> {
    return this.db.consultation.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        departmentId: data.departmentId,
        reason: data.reason,
        notes: data.notes ?? null,
        status: data.status,
        scheduledAt: data.scheduledAt ?? null,
        ...(data.status === "IN_PROGRESS" ? { startedAt: new Date() } : {}),
        ...(data.status === "COMPLETED"
          ? { startedAt: new Date(), completedAt: new Date() }
          : {}),
      },
      select: consultationSummarySelect,
    });
  }

  async update(
    id: string,
    data: UpdateConsultationInput,
  ): Promise<ConsultationSummaryRecord | null> {
    const existing = await this.db.consultation.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    return this.db.consultation.update({
      where: { id },
      data: {
        ...(data.patientId !== undefined ? { patientId: data.patientId } : {}),
        ...(data.doctorId !== undefined ? { doctorId: data.doctorId } : {}),
        ...(data.departmentId !== undefined
          ? { departmentId: data.departmentId }
          : {}),
        ...(data.reason !== undefined ? { reason: data.reason } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.scheduledAt !== undefined
          ? { scheduledAt: data.scheduledAt }
          : {}),
      },
      select: consultationSummarySelect,
    });
  }

  async updateStatus(
    id: string,
    data: UpdateConsultationStatusInput,
  ): Promise<ConsultationSummaryRecord | null> {
    const existing = await this.db.consultation.findUnique({
      where: { id },
      select: { id: true, startedAt: true, completedAt: true },
    });

    if (!existing) {
      return null;
    }

    const timestamps = this.buildStatusTimestamps(
      data.status,
      existing.startedAt,
      existing.completedAt,
    );

    return this.db.consultation.update({
      where: { id },
      data: {
        status: data.status,
        ...timestamps,
      },
      select: consultationSummarySelect,
    });
  }

  private buildStatusTimestamps(
    status: ConsultationStatus,
    startedAt: Date | null,
    completedAt: Date | null,
  ): Pick<Prisma.ConsultationUpdateInput, "startedAt" | "completedAt"> {
    if (status === "IN_PROGRESS" && !startedAt) {
      return { startedAt: new Date() };
    }

    if (status === "COMPLETED") {
      return {
        startedAt: startedAt ?? new Date(),
        completedAt: completedAt ?? new Date(),
      };
    }

    return {};
  }

  async patientExists(id: string): Promise<boolean> {
    const count = await this.db.patient.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  async doctorExists(id: string): Promise<boolean> {
    const count = await this.db.user.count({
      where: { id, role: "DOCTOR", active: true },
    });
    return count > 0;
  }

  async departmentExists(id: string): Promise<boolean> {
    const count = await this.db.department.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }
}
