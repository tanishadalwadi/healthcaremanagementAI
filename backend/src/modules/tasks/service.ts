import { BadRequestError, NotFoundError } from "../../errors/app-error.js";
import type {
  TaskDetailRecord,
  TaskRepository,
  TaskSummaryRecord,
} from "./repository.js";
import type {
  CreateTaskInput,
  PaginatedResult,
  TaskDetailDto,
  TaskListQuery,
  TaskSummaryDto,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from "./types.js";

function toTaskSummaryDto(task: TaskSummaryRecord): TaskSummaryDto {
  return {
    id: task.id,
    patientId: task.patientId,
    title: task.title,
    description: task.description,
    assignedTo: task.assignedTo,
    status: task.status,
    dueAt: task.dueAt,
    completedAt: task.completedAt,
  };
}

function toTaskDetailDto(task: TaskDetailRecord): TaskDetailDto {
  return {
    ...toTaskSummaryDto(task),
    patient: {
      id: task.patient.id,
      patientNumber: task.patient.patientNumber,
      firstName: task.patient.firstName,
      lastName: task.patient.lastName,
    },
    assignee: {
      id: task.assignee.id,
      name: task.assignee.name,
      email: task.assignee.email,
      role: task.assignee.role,
    },
  };
}

export class TaskService {
  constructor(private readonly repository: TaskRepository) {}

  async listTasks(query: TaskListQuery): Promise<PaginatedResult<TaskSummaryDto>> {
    const { items, total } = await this.repository.findMany(query);
    const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);

    return {
      items: items.map(toTaskSummaryDto),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  async listTasksByPatient(
    patientId: string,
    query: Omit<TaskListQuery, "patientId">,
  ): Promise<PaginatedResult<TaskSummaryDto>> {
    await this.ensurePatientExists(patientId);

    return this.listTasks({
      ...query,
      patientId,
    });
  }

  async listTasksByAssignee(
    assignedTo: string,
    query: Omit<TaskListQuery, "assignedTo">,
  ): Promise<PaginatedResult<TaskSummaryDto>> {
    await this.ensureAssigneeExists(assignedTo);

    return this.listTasks({
      ...query,
      assignedTo,
    });
  }

  async getTaskById(id: string): Promise<TaskDetailDto> {
    const task = await this.repository.findById(id);

    if (!task) {
      throw new NotFoundError(`Task with id "${id}" was not found`);
    }

    return toTaskDetailDto(task);
  }

  async createTask(input: CreateTaskInput): Promise<TaskSummaryDto> {
    await this.validateReferences(input);

    const task = await this.repository.create(input);
    return toTaskSummaryDto(task);
  }

  async updateTask(id: string, input: UpdateTaskInput): Promise<TaskSummaryDto> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError(`Task with id "${id}" was not found`);
    }

    await this.validateReferences({
      patientId: input.patientId ?? existing.patientId,
      title: input.title ?? existing.title,
      assignedTo: input.assignedTo ?? existing.assignedTo,
    });

    const task = await this.repository.update(id, input);

    if (!task) {
      throw new NotFoundError(`Task with id "${id}" was not found`);
    }

    return toTaskSummaryDto(task);
  }

  async updateTaskStatus(
    id: string,
    input: UpdateTaskStatusInput,
  ): Promise<TaskSummaryDto> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError(`Task with id "${id}" was not found`);
    }

    const task = await this.repository.updateStatus(id, input);

    if (!task) {
      throw new NotFoundError(`Task with id "${id}" was not found`);
    }

    return toTaskSummaryDto(task);
  }

  private async ensurePatientExists(patientId: string): Promise<void> {
    const exists = await this.repository.patientExists(patientId);

    if (!exists) {
      throw new NotFoundError(`Patient with id "${patientId}" was not found`);
    }
  }

  private async ensureAssigneeExists(assignedTo: string): Promise<void> {
    const exists = await this.repository.assigneeExists(assignedTo);

    if (!exists) {
      throw new NotFoundError(`User with id "${assignedTo}" was not found`);
    }
  }

  private async validateReferences(
    input: Pick<CreateTaskInput, "patientId" | "title" | "assignedTo">,
  ): Promise<void> {
    const [patientExists, assigneeExists] = await Promise.all([
      this.repository.patientExists(input.patientId),
      this.repository.assigneeExists(input.assignedTo),
    ]);

    if (!patientExists) {
      throw new BadRequestError(
        `Patient with id "${input.patientId}" was not found`,
      );
    }

    if (!assigneeExists) {
      throw new BadRequestError(
        `Assignee with id "${input.assignedTo}" was not found or is inactive`,
      );
    }
  }
}
