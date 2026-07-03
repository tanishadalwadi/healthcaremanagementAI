import { BadRequestError, NotFoundError } from "../../errors/app-error.js";
import type {
  DepartmentDetailRecord,
  DepartmentRepository,
  DepartmentSummaryRecord,
} from "./repository.js";
import type {
  CreateDepartmentInput,
  DepartmentDetailDto,
  DepartmentListQuery,
  DepartmentSummaryDto,
  PaginatedResult,
  UpdateDepartmentInput,
} from "./types.js";

function toDepartmentSummaryDto(
  department: DepartmentSummaryRecord,
): DepartmentSummaryDto {
  return {
    id: department.id,
    name: department.name,
    status: department.status,
    createdAt: department.createdAt,
    updatedAt: department.updatedAt,
  };
}

function toDepartmentDetailDto(
  department: DepartmentDetailRecord,
): DepartmentDetailDto {
  return {
    ...toDepartmentSummaryDto(department),
    patientCount: department._count.patients,
  };
}

export class DepartmentService {
  constructor(private readonly repository: DepartmentRepository) {}

  async listDepartments(
    query: DepartmentListQuery,
  ): Promise<PaginatedResult<DepartmentSummaryDto>> {
    const { items, total } = await this.repository.findMany(query);
    const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);

    return {
      items: items.map(toDepartmentSummaryDto),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  async getDepartmentById(id: string): Promise<DepartmentDetailDto> {
    const department = await this.repository.findById(id);

    if (!department) {
      throw new NotFoundError(`Department with id "${id}" was not found`);
    }

    return toDepartmentDetailDto(department);
  }

  async createDepartment(
    input: CreateDepartmentInput,
  ): Promise<DepartmentSummaryDto> {
    const existing = await this.repository.findByName(input.name);

    if (existing) {
      throw new BadRequestError(
        `Department with name "${input.name}" already exists`,
      );
    }

    const department = await this.repository.create(input);
    return toDepartmentSummaryDto(department);
  }

  async updateDepartment(
    id: string,
    input: UpdateDepartmentInput,
  ): Promise<DepartmentSummaryDto> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError(`Department with id "${id}" was not found`);
    }

    if (input.name && input.name !== existing.name) {
      const duplicate = await this.repository.findByName(input.name);

      if (duplicate && duplicate.id !== id) {
        throw new BadRequestError(
          `Department with name "${input.name}" already exists`,
        );
      }
    }

    const department = await this.repository.update(id, input);

    if (!department) {
      throw new NotFoundError(`Department with id "${id}" was not found`);
    }

    return toDepartmentSummaryDto(department);
  }

  async deleteDepartment(id: string): Promise<DepartmentSummaryDto> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError(`Department with id "${id}" was not found`);
    }

    if (existing._count.patients > 0) {
      throw new BadRequestError(
        `Cannot delete department "${existing.name}" while it has assigned patients`,
      );
    }

    const department = await this.repository.softDelete(id);

    if (!department) {
      throw new NotFoundError(`Department with id "${id}" was not found`);
    }

    return toDepartmentSummaryDto(department);
  }
}
