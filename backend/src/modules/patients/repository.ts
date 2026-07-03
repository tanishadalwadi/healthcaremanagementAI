import type { Prisma, PrismaClient } from "@prisma/client";
import type { CreatePatientInput, PatientListQuery, UpdatePatientInput } from "./types.js";

const patientSummarySelect = {
  id: true,
  patientNumber: true,
  firstName: true,
  lastName: true,
  age: true,
  gender: true,
  room: true,
  status: true,
  priority: true,
  departmentId: true,
  assignedNurseId: true,
  assignedDoctorId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PatientSelect;

const patientDetailInclude = {
  department: {
    select: {
      id: true,
      name: true,
      status: true,
    },
  },
  assignedNurse: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  assignedDoctor: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  workflowEvents: {
    orderBy: { sequence: "asc" as const },
    select: {
      id: true,
      title: true,
      description: true,
      eventType: true,
      sequence: true,
      status: true,
      occurredAt: true,
      startedAt: true,
      completedAt: true,
    },
  },
  tasks: {
    orderBy: { dueAt: "asc" as const },
    select: {
      id: true,
      title: true,
      description: true,
      assignedTo: true,
      status: true,
      dueAt: true,
      completedAt: true,
    },
  },
  events: {
    orderBy: { timestamp: "desc" as const },
    select: {
      id: true,
      eventType: true,
      description: true,
      createdBy: true,
      timestamp: true,
    },
  },
} satisfies Prisma.PatientInclude;

export type PatientSummaryRecord = Prisma.PatientGetPayload<{
  select: typeof patientSummarySelect;
}>;

export type PatientDetailRecord = Prisma.PatientGetPayload<{
  include: typeof patientDetailInclude;
}>;

export class PatientRepository {
  constructor(private readonly db: PrismaClient) {}

  async findMany(query: PatientListQuery) {
    const { page, limit, search, department, status, priority } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PatientWhereInput = {
      deletedAt: null,
      ...(department ? { departmentId: department } : {}),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { patientNumber: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.db.$transaction([
      this.db.patient.findMany({
        where,
        select: patientSummarySelect,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.db.patient.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<PatientDetailRecord | null> {
    return this.db.patient.findFirst({
      where: { id, deletedAt: null },
      include: patientDetailInclude,
    });
  }

  async findByPatientNumber(patientNumber: string) {
    return this.db.patient.findFirst({
      where: { patientNumber, deletedAt: null },
      select: { id: true },
    });
  }

  async create(data: CreatePatientInput): Promise<PatientSummaryRecord> {
    return this.db.patient.create({
      data: {
        patientNumber: data.patientNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        age: data.age,
        gender: data.gender,
        room: data.room ?? null,
        departmentId: data.departmentId,
        status: data.status,
        priority: data.priority,
        assignedNurseId: data.assignedNurseId ?? null,
        assignedDoctorId: data.assignedDoctorId ?? null,
      },
      select: patientSummarySelect,
    });
  }

  async update(
    id: string,
    data: UpdatePatientInput,
  ): Promise<PatientSummaryRecord | null> {
    const existing = await this.db.patient.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    return this.db.patient.update({
      where: { id },
      data: {
        ...(data.patientNumber !== undefined ? { patientNumber: data.patientNumber } : {}),
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        ...(data.age !== undefined ? { age: data.age } : {}),
        ...(data.gender !== undefined ? { gender: data.gender } : {}),
        ...(data.room !== undefined ? { room: data.room } : {}),
        ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
        ...(data.assignedNurseId !== undefined
          ? { assignedNurseId: data.assignedNurseId }
          : {}),
        ...(data.assignedDoctorId !== undefined
          ? { assignedDoctorId: data.assignedDoctorId }
          : {}),
      },
      select: patientSummarySelect,
    });
  }

  async softDelete(id: string): Promise<PatientSummaryRecord | null> {
    const existing = await this.db.patient.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    return this.db.patient.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: patientSummarySelect,
    });
  }

  async departmentExists(id: string): Promise<boolean> {
    const count = await this.db.department.count({ where: { id } });
    return count > 0;
  }

  async userExistsWithRole(
    id: string,
    role: "NURSE" | "DOCTOR",
  ): Promise<boolean> {
    const count = await this.db.user.count({ where: { id, role } });
    return count > 0;
  }
}
