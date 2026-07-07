import { NotFoundError } from "../../errors/app-error.js";
import type { VitalSignRepository, VitalSignRecord } from "./repository.js";
import type {
  CreateVitalSignInput,
  PaginatedResult,
  VitalSignDto,
  VitalSignListQuery,
} from "./types.js";

function toDto(record: VitalSignRecord): VitalSignDto {
  return {
    id: record.id,
    patientId: record.patientId,
    recordedById: record.recordedById,
    bloodPressure: record.bloodPressure,
    pulse: record.pulse,
    temperature: record.temperature,
    respRate: record.respRate,
    o2Saturation: record.o2Saturation,
    recordedAt: record.recordedAt,
  };
}

export class VitalSignService {
  constructor(private readonly repository: VitalSignRepository) {}

  async listByPatient(
    patientId: string,
    query: VitalSignListQuery,
  ): Promise<PaginatedResult<VitalSignDto>> {
    const exists = await this.repository.patientExists(patientId);
    if (!exists) {
      throw new NotFoundError(`Patient with id "${patientId}" was not found`);
    }

    const { items, total } = await this.repository.findByPatient(
      patientId,
      query,
    );
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

  async createForPatient(
    patientId: string,
    input: CreateVitalSignInput,
  ): Promise<VitalSignDto> {
    const exists = await this.repository.patientExists(patientId);
    if (!exists) {
      throw new NotFoundError(`Patient with id "${patientId}" was not found`);
    }

    const record = await this.repository.create(patientId, input);
    return toDto(record);
  }
}
