import { NotFoundError } from "../../errors/app-error.js";
import type { AmbulanceRecord, AmbulanceRepository } from "./repository.js";
import type {
  AmbulanceDto,
  AmbulanceListQuery,
  PaginatedResult,
  UpdateAmbulanceStatusInput,
} from "./types.js";

function toDto(record: AmbulanceRecord): AmbulanceDto {
  return {
    id: record.id,
    unitLabel: record.unitLabel,
    label: record.label,
    status: record.status,
  };
}

export class AmbulanceService {
  constructor(private readonly repository: AmbulanceRepository) {}

  async listAmbulances(
    query: AmbulanceListQuery,
  ): Promise<PaginatedResult<AmbulanceDto>> {
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

  async updateStatus(
    id: string,
    input: UpdateAmbulanceStatusInput,
  ): Promise<AmbulanceDto> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError(`Ambulance with id "${id}" was not found`);
    }

    const updated = await this.repository.updateStatus(id, input);

    if (!updated) {
      throw new NotFoundError(`Ambulance with id "${id}" was not found`);
    }

    return toDto(updated);
  }
}
