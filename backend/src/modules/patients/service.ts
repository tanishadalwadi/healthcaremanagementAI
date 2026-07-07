import { BadRequestError, NotFoundError } from "../../errors/app-error.js";
import type { PatientRepository, PatientDetailRecord, PatientSummaryRecord } from "./repository.js";
import type {
  CreatePatientInput,
  PaginatedResult,
  PatientDetailDto,
  PatientListQuery,
  PatientSummaryDto,
  UpdatePatientInput,
} from "./types.js";

function toPatientSummaryDto(patient: PatientSummaryRecord): PatientSummaryDto {
  return {
    id: patient.id,
    patientNumber: patient.patientNumber,
    firstName: patient.firstName,
    lastName: patient.lastName,
    age: patient.age,
    gender: patient.gender,
    room: patient.room,
    diagnosis: patient.diagnosis,
    status: patient.status,
    priority: patient.priority,
    departmentId: patient.departmentId,
    assignedNurseId: patient.assignedNurseId,
    assignedDoctorId: patient.assignedDoctorId,
    dischargeRequestedAt: patient.dischargeRequestedAt,
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
  };
}

function toPatientDetailDto(patient: PatientDetailRecord): PatientDetailDto {
  return {
    ...toPatientSummaryDto(patient),
    department: {
      id: patient.department.id,
      name: patient.department.name,
      status: patient.department.status,
    },
    assignedNurse: patient.assignedNurse
      ? {
          id: patient.assignedNurse.id,
          name: patient.assignedNurse.name,
          email: patient.assignedNurse.email,
          role: patient.assignedNurse.role,
        }
      : null,
    assignedDoctor: patient.assignedDoctor
      ? {
          id: patient.assignedDoctor.id,
          name: patient.assignedDoctor.name,
          email: patient.assignedDoctor.email,
          role: patient.assignedDoctor.role,
        }
      : null,
    workflowEvents: patient.workflowEvents.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      sequence: event.sequence,
      status: event.status,
      occurredAt: event.occurredAt,
      startedAt: event.startedAt,
      completedAt: event.completedAt,
    })),
    tasks: patient.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      status: task.status,
      dueAt: task.dueAt,
      completedAt: task.completedAt,
    })),
    events: patient.events.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      description: event.description,
      createdBy: event.createdBy,
      timestamp: event.timestamp,
    })),
  };
}

export class PatientService {
  constructor(private readonly repository: PatientRepository) {}

  async listPatients(
    query: PatientListQuery,
  ): Promise<PaginatedResult<PatientSummaryDto>> {
    const { items, total } = await this.repository.findMany(query);
    const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);

    return {
      items: items.map(toPatientSummaryDto),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  async listPatientsByUser(
    userId: string,
    query: PatientListQuery,
  ): Promise<PaginatedResult<PatientSummaryDto>> {
    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw new NotFoundError(`User with id "${userId}" was not found`);
    }

    if (user.role === "NURSE") {
      return this.listPatients({ ...query, assignedNurseId: userId });
    }

    if (user.role === "DOCTOR") {
      return this.listPatients({ ...query, assignedDoctorId: userId });
    }

    throw new BadRequestError(
      `Patients cannot be listed for user role "${user.role}"`,
    );
  }

  async getPatientById(id: string): Promise<PatientDetailDto> {
    const patient = await this.repository.findById(id);

    if (!patient) {
      throw new NotFoundError(`Patient with id "${id}" was not found`);
    }

    return toPatientDetailDto(patient);
  }

  async createPatient(input: CreatePatientInput): Promise<PatientSummaryDto> {
    await this.validateReferences(input);

    const existingPatient = await this.repository.findByPatientNumber(
      input.patientNumber,
    );

    if (existingPatient) {
      throw new BadRequestError(
        `Patient number "${input.patientNumber}" is already in use`,
      );
    }

    const patient = await this.repository.create(input);
    return toPatientSummaryDto(patient);
  }

  async updatePatient(
    id: string,
    input: UpdatePatientInput,
  ): Promise<PatientSummaryDto> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError(`Patient with id "${id}" was not found`);
    }

    if (
      input.patientNumber &&
      input.patientNumber !== existing.patientNumber
    ) {
      const duplicate = await this.repository.findByPatientNumber(
        input.patientNumber,
      );

      if (duplicate && duplicate.id !== id) {
        throw new BadRequestError(
          `Patient number "${input.patientNumber}" is already in use`,
        );
      }
    }

    await this.validateReferences(input);

    const patient = await this.repository.update(id, input);

    if (!patient) {
      throw new NotFoundError(`Patient with id "${id}" was not found`);
    }

    return toPatientSummaryDto(patient);
  }

  async deletePatient(id: string): Promise<PatientSummaryDto> {
    const patient = await this.repository.softDelete(id);

    if (!patient) {
      throw new NotFoundError(`Patient with id "${id}" was not found`);
    }

    return toPatientSummaryDto(patient);
  }

  private async validateReferences(
    input: CreatePatientInput | UpdatePatientInput,
  ): Promise<void> {
    if (input.departmentId) {
      const departmentExists = await this.repository.departmentExists(
        input.departmentId,
      );

      if (!departmentExists) {
        throw new BadRequestError(
          `Department with id "${input.departmentId}" was not found`,
        );
      }
    }

    if (input.assignedNurseId) {
      const nurseExists = await this.repository.userExistsWithRole(
        input.assignedNurseId,
        "NURSE",
      );

      if (!nurseExists) {
        throw new BadRequestError(
          `Nurse with id "${input.assignedNurseId}" was not found`,
        );
      }
    }

    if (input.assignedDoctorId) {
      const doctorExists = await this.repository.userExistsWithRole(
        input.assignedDoctorId,
        "DOCTOR",
      );

      if (!doctorExists) {
        throw new BadRequestError(
          `Doctor with id "${input.assignedDoctorId}" was not found`,
        );
      }
    }
  }
}
