import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../errors/app-error.js";
import type { BedRecord, BedRepository } from "./repository.js";
import type {
  AssignBedInput,
  BedDto,
  BedListQuery,
  PaginatedResult,
} from "./types.js";

function toDto(record: BedRecord): BedDto {
  return {
    id: record.id,
    roomLabel: record.roomLabel,
    departmentId: record.departmentId,
    departmentName: record.department.name,
    status: record.status,
    patientId: record.patientId,
    patientName: record.patient
      ? `${record.patient.firstName} ${record.patient.lastName}`
      : null,
  };
}

export class BedService {
  constructor(private readonly repository: BedRepository) {}

  async listBeds(query: BedListQuery): Promise<PaginatedResult<BedDto>> {
    const { items, total } = await this.repository.findMany(query);
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

  async assignBed(bedId: string, input: AssignBedInput): Promise<BedDto> {
    const bed = await this.repository.findById(bedId);

    if (!bed) {
      throw new NotFoundError(`Bed with id "${bedId}" was not found`);
    }

    if (bed.status === "OCCUPIED" && bed.patientId !== input.patientId) {
      throw new ConflictError(`Bed "${bed.roomLabel}" is already occupied`);
    }

    const patientExists = await this.repository.patientExists(input.patientId);
    if (!patientExists) {
      throw new NotFoundError(
        `Patient with id "${input.patientId}" was not found`,
      );
    }

    const updated = await this.repository.assignBed(
      bedId,
      input.patientId,
      bed.roomLabel,
    );

    return toDto(updated);
  }

  async releaseBed(bedId: string): Promise<BedDto> {
    const bed = await this.repository.findById(bedId);

    if (!bed) {
      throw new NotFoundError(`Bed with id "${bedId}" was not found`);
    }

    if (bed.status === "AVAILABLE" || !bed.patientId) {
      throw new BadRequestError(`Bed "${bed.roomLabel}" is not occupied`);
    }

    const updated = await this.repository.releaseBed(bedId);

    if (!updated) {
      throw new NotFoundError(`Bed with id "${bedId}" was not found`);
    }

    return toDto(updated);
  }
}
