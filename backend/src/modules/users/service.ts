import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../errors/app-error.js";
import type {
  UserDetailRecord,
  UserRepository,
  UserSummaryRecord,
} from "./repository.js";
import type {
  CreateUserInput,
  PaginatedResult,
  UpdateUserInput,
  UpdateUserStatusInput,
  UserDetailDto,
  UserListQuery,
  UserSummaryDto,
} from "./types.js";

function toUserSummaryDto(user: UserSummaryRecord): UserSummaryDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    departmentId: user.departmentId,
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function toUserDetailDto(user: UserDetailRecord): UserDetailDto {
  return {
    ...toUserSummaryDto(user),
    department: user.department
      ? {
          id: user.department.id,
          name: user.department.name,
          status: user.department.status,
        }
      : null,
    assignedPatientsCount:
      user._count.assignedPatientsAsNurse +
      user._count.assignedPatientsAsDoctor,
  };
}

export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async listUsers(query: UserListQuery): Promise<PaginatedResult<UserSummaryDto>> {
    const { items, total } = await this.repository.findMany(query);
    const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);

    return {
      items: items.map(toUserSummaryDto),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  async getUserById(id: string): Promise<UserDetailDto> {
    const user = await this.repository.findById(id);

    if (!user) {
      throw new NotFoundError(`User with id "${id}" was not found`);
    }

    return toUserDetailDto(user);
  }

  async createUser(input: CreateUserInput): Promise<UserSummaryDto> {
    await this.validateDepartment(input.departmentId);

    const existing = await this.repository.findByEmail(input.email.toLowerCase());

    if (existing) {
      throw new ConflictError(`User with email "${input.email}" already exists`);
    }

    const user = await this.repository.create({
      ...input,
      email: input.email.toLowerCase(),
    });

    return toUserSummaryDto(user);
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<UserSummaryDto> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError(`User with id "${id}" was not found`);
    }

    if (input.email && input.email.toLowerCase() !== existing.email) {
      const duplicate = await this.repository.findByEmail(
        input.email.toLowerCase(),
      );

      if (duplicate && duplicate.id !== id) {
        throw new ConflictError(
          `User with email "${input.email}" already exists`,
        );
      }
    }

    await this.validateDepartment(input.departmentId);

    const user = await this.repository.update(id, {
      ...input,
      ...(input.email !== undefined
        ? { email: input.email.toLowerCase() }
        : {}),
    });

    if (!user) {
      throw new NotFoundError(`User with id "${id}" was not found`);
    }

    return toUserSummaryDto(user);
  }

  async updateUserStatus(
    id: string,
    input: UpdateUserStatusInput,
  ): Promise<UserSummaryDto> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError(`User with id "${id}" was not found`);
    }

    const user = await this.repository.updateStatus(id, input);

    if (!user) {
      throw new NotFoundError(`User with id "${id}" was not found`);
    }

    return toUserSummaryDto(user);
  }

  private async validateDepartment(
    departmentId?: string | null,
  ): Promise<void> {
    if (!departmentId) {
      return;
    }

    const departmentExists = await this.repository.departmentExists(departmentId);

    if (!departmentExists) {
      throw new BadRequestError(
        `Department with id "${departmentId}" was not found`,
      );
    }
  }
}
