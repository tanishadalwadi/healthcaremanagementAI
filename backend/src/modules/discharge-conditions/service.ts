import { NotFoundError } from "../../errors/app-error.js";
import type {
  DischargeConditionRecord,
  DischargeConditionRepository,
} from "./repository.js";
import type {
  DischargeConditionDto,
  UpdateDischargeConditionInput,
} from "./types.js";

function toDto(record: DischargeConditionRecord): DischargeConditionDto {
  return {
    id: record.id,
    patientId: record.patientId,
    condition: record.condition,
    status: record.status,
    owningDepartment: record.owningDepartment,
    updatedAt: record.updatedAt,
  };
}

export class DischargeConditionService {
  constructor(private readonly repository: DischargeConditionRepository) {}

  async listByPatient(patientId: string): Promise<DischargeConditionDto[]> {
    const exists = await this.repository.patientExists(patientId);
    if (!exists) {
      throw new NotFoundError(`Patient with id "${patientId}" was not found`);
    }

    const items = await this.repository.findByPatient(patientId);
    return items.map(toDto);
  }

  async updateStatus(
    id: string,
    input: UpdateDischargeConditionInput,
  ): Promise<DischargeConditionDto> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError(
        `Discharge condition with id "${id}" was not found`,
      );
    }

    const updated = await this.repository.updateStatus(id, input);

    if (!updated) {
      throw new NotFoundError(
        `Discharge condition with id "${id}" was not found`,
      );
    }

    return toDto(updated);
  }
}
