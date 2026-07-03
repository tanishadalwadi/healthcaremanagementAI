import { BadRequestError, NotFoundError } from "../../errors/app-error.js";
import type {
  WorkflowEventDetailRecord,
  WorkflowEventRepository,
  WorkflowEventSummaryRecord,
} from "./repository.js";
import type {
  CreateWorkflowEventInput,
  PaginatedResult,
  UpdateWorkflowEventInput,
  UpdateWorkflowEventStatusInput,
  WorkflowEventDetailDto,
  WorkflowEventListQuery,
  WorkflowEventSummaryDto,
} from "./types.js";

function toWorkflowEventSummaryDto(
  event: WorkflowEventSummaryRecord,
): WorkflowEventSummaryDto {
  return {
    id: event.id,
    patientId: event.patientId,
    title: event.title,
    description: event.description,
    eventType: event.eventType,
    status: event.status,
    sequence: event.sequence,
    createdBy: event.createdBy,
    occurredAt: event.occurredAt,
    startedAt: event.startedAt,
    completedAt: event.completedAt,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

function toWorkflowEventDetailDto(
  event: WorkflowEventDetailRecord,
): WorkflowEventDetailDto {
  return {
    ...toWorkflowEventSummaryDto(event),
    patient: {
      id: event.patient.id,
      patientNumber: event.patient.patientNumber,
      firstName: event.patient.firstName,
      lastName: event.patient.lastName,
    },
    creator: event.creator
      ? {
          id: event.creator.id,
          name: event.creator.name,
          email: event.creator.email,
          role: event.creator.role,
        }
      : null,
  };
}

export class WorkflowEventService {
  constructor(private readonly repository: WorkflowEventRepository) {}

  async listWorkflowEvents(
    query: WorkflowEventListQuery,
  ): Promise<PaginatedResult<WorkflowEventSummaryDto>> {
    const { items, total } = await this.repository.findMany(query);
    const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);

    return {
      items: items.map(toWorkflowEventSummaryDto),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  async listWorkflowEventsByPatient(
    patientId: string,
    query: Omit<WorkflowEventListQuery, "patientId">,
  ): Promise<PaginatedResult<WorkflowEventSummaryDto>> {
    await this.ensurePatientExists(patientId);

    return this.listWorkflowEvents({
      ...query,
      patientId,
    });
  }

  async getWorkflowEventById(id: string): Promise<WorkflowEventDetailDto> {
    const event = await this.repository.findById(id);

    if (!event) {
      throw new NotFoundError(`Workflow event with id "${id}" was not found`);
    }

    return toWorkflowEventDetailDto(event);
  }

  async createWorkflowEvent(
    input: CreateWorkflowEventInput,
  ): Promise<WorkflowEventSummaryDto> {
    await this.validateReferences(input);

    const duplicate = await this.repository.findByPatientSequence(
      input.patientId,
      input.sequence,
    );

    if (duplicate) {
      throw new BadRequestError(
        `Workflow event sequence ${input.sequence} already exists for this patient`,
      );
    }

    const event = await this.repository.create(input);
    return toWorkflowEventSummaryDto(event);
  }

  async updateWorkflowEvent(
    id: string,
    input: UpdateWorkflowEventInput,
  ): Promise<WorkflowEventSummaryDto> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError(`Workflow event with id "${id}" was not found`);
    }

    const nextPatientId = input.patientId ?? existing.patientId;
    const nextSequence = input.sequence ?? existing.sequence;

    if (
      input.sequence !== undefined &&
      (input.patientId !== undefined || input.sequence !== existing.sequence)
    ) {
      const duplicate = await this.repository.findByPatientSequence(
        nextPatientId,
        nextSequence,
      );

      if (duplicate && duplicate.id !== id) {
        throw new BadRequestError(
          `Workflow event sequence ${nextSequence} already exists for this patient`,
        );
      }
    }

    await this.validateReferences({
      patientId: nextPatientId,
      title: input.title ?? existing.title,
      eventType: input.eventType ?? existing.eventType,
      sequence: nextSequence,
      createdBy: input.createdBy ?? existing.createdBy,
    });

    const event = await this.repository.update(id, input);

    if (!event) {
      throw new NotFoundError(`Workflow event with id "${id}" was not found`);
    }

    return toWorkflowEventSummaryDto(event);
  }

  async updateWorkflowEventStatus(
    id: string,
    input: UpdateWorkflowEventStatusInput,
  ): Promise<WorkflowEventSummaryDto> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError(`Workflow event with id "${id}" was not found`);
    }

    if (existing.status === "COMPLETED" && input.status !== "COMPLETED") {
      throw new BadRequestError("Completed workflow events cannot change status");
    }

    const event = await this.repository.updateStatus(id, input);

    if (!event) {
      throw new NotFoundError(`Workflow event with id "${id}" was not found`);
    }

    return toWorkflowEventSummaryDto(event);
  }

  private async ensurePatientExists(patientId: string): Promise<void> {
    const exists = await this.repository.patientExists(patientId);

    if (!exists) {
      throw new NotFoundError(`Patient with id "${patientId}" was not found`);
    }
  }

  private async validateReferences(
    input: Pick<
      CreateWorkflowEventInput,
      "patientId" | "title" | "eventType" | "sequence" | "createdBy"
    >,
  ): Promise<void> {
    const patientExists = await this.repository.patientExists(input.patientId);

    if (!patientExists) {
      throw new BadRequestError(
        `Patient with id "${input.patientId}" was not found`,
      );
    }

    if (input.createdBy) {
      const userExists = await this.repository.userExists(input.createdBy);

      if (!userExists) {
        throw new BadRequestError(
          `User with id "${input.createdBy}" was not found or is inactive`,
        );
      }
    }
  }
}
