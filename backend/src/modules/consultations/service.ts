import { BadRequestError, NotFoundError } from "../../errors/app-error.js";
import type {
  ConsultationDetailRecord,
  ConsultationRepository,
  ConsultationSummaryRecord,
} from "./repository.js";
import type {
  ConsultationDetailDto,
  ConsultationListQuery,
  ConsultationSummaryDto,
  CreateConsultationInput,
  PaginatedResult,
  UpdateConsultationInput,
  UpdateConsultationStatusInput,
} from "./types.js";

function toConsultationSummaryDto(
  consultation: ConsultationSummaryRecord,
): ConsultationSummaryDto {
  return {
    id: consultation.id,
    patientId: consultation.patientId,
    doctorId: consultation.doctorId,
    departmentId: consultation.departmentId,
    reason: consultation.reason,
    notes: consultation.notes,
    status: consultation.status,
    scheduledAt: consultation.scheduledAt,
    startedAt: consultation.startedAt,
    completedAt: consultation.completedAt,
    createdAt: consultation.createdAt,
    updatedAt: consultation.updatedAt,
  };
}

function toConsultationDetailDto(
  consultation: ConsultationDetailRecord,
): ConsultationDetailDto {
  return {
    ...toConsultationSummaryDto(consultation),
    patient: {
      id: consultation.patient.id,
      patientNumber: consultation.patient.patientNumber,
      firstName: consultation.patient.firstName,
      lastName: consultation.patient.lastName,
    },
    doctor: {
      id: consultation.doctor.id,
      name: consultation.doctor.name,
      email: consultation.doctor.email,
      role: consultation.doctor.role,
    },
    department: {
      id: consultation.department.id,
      name: consultation.department.name,
      status: consultation.department.status,
    },
  };
}

export class ConsultationService {
  constructor(private readonly repository: ConsultationRepository) {}

  async listConsultations(
    query: ConsultationListQuery,
  ): Promise<PaginatedResult<ConsultationSummaryDto>> {
    const { items, total } = await this.repository.findMany(query);
    const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);

    return {
      items: items.map(toConsultationSummaryDto),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  async listConsultationsByPatient(
    patientId: string,
    query: Omit<ConsultationListQuery, "patientId">,
  ): Promise<PaginatedResult<ConsultationSummaryDto>> {
    await this.ensurePatientExists(patientId);

    return this.listConsultations({
      ...query,
      patientId,
    });
  }

  async getConsultationById(id: string): Promise<ConsultationDetailDto> {
    const consultation = await this.repository.findById(id);

    if (!consultation) {
      throw new NotFoundError(`Consultation with id "${id}" was not found`);
    }

    return toConsultationDetailDto(consultation);
  }

  async createConsultation(
    input: CreateConsultationInput,
  ): Promise<ConsultationSummaryDto> {
    await this.validateReferences(input);

    const consultation = await this.repository.create(input);
    return toConsultationSummaryDto(consultation);
  }

  async updateConsultation(
    id: string,
    input: UpdateConsultationInput,
  ): Promise<ConsultationSummaryDto> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError(`Consultation with id "${id}" was not found`);
    }

    await this.validateReferences({
      patientId: input.patientId ?? existing.patientId,
      doctorId: input.doctorId ?? existing.doctorId,
      departmentId: input.departmentId ?? existing.departmentId,
      reason: input.reason ?? existing.reason,
    });

    const consultation = await this.repository.update(id, input);

    if (!consultation) {
      throw new NotFoundError(`Consultation with id "${id}" was not found`);
    }

    return toConsultationSummaryDto(consultation);
  }

  async updateConsultationStatus(
    id: string,
    input: UpdateConsultationStatusInput,
  ): Promise<ConsultationSummaryDto> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError(`Consultation with id "${id}" was not found`);
    }

    if (
      existing.status === "COMPLETED" &&
      input.status !== "COMPLETED"
    ) {
      throw new BadRequestError("Completed consultations cannot change status");
    }

    if (
      existing.status === "CANCELLED" &&
      input.status !== "CANCELLED"
    ) {
      throw new BadRequestError("Cancelled consultations cannot change status");
    }

    const consultation = await this.repository.updateStatus(id, input);

    if (!consultation) {
      throw new NotFoundError(`Consultation with id "${id}" was not found`);
    }

    return toConsultationSummaryDto(consultation);
  }

  private async ensurePatientExists(patientId: string): Promise<void> {
    const exists = await this.repository.patientExists(patientId);

    if (!exists) {
      throw new NotFoundError(`Patient with id "${patientId}" was not found`);
    }
  }

  private async validateReferences(
    input: Pick<
      CreateConsultationInput,
      "patientId" | "doctorId" | "departmentId" | "reason"
    >,
  ): Promise<void> {
    const [patientExists, doctorExists, departmentExists] = await Promise.all([
      this.repository.patientExists(input.patientId),
      this.repository.doctorExists(input.doctorId),
      this.repository.departmentExists(input.departmentId),
    ]);

    if (!patientExists) {
      throw new BadRequestError(
        `Patient with id "${input.patientId}" was not found`,
      );
    }

    if (!doctorExists) {
      throw new BadRequestError(
        `Doctor with id "${input.doctorId}" was not found or is inactive`,
      );
    }

    if (!departmentExists) {
      throw new BadRequestError(
        `Department with id "${input.departmentId}" was not found`,
      );
    }
  }
}
