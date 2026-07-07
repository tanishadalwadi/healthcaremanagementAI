import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../../errors/app-error.js";
import { sendError, sendSuccess } from "../../utils/api-response.js";
import { HttpStatus } from "../../utils/http.js";
import type { WorkflowEventService } from "./service.js";
import {
  createWorkflowEventBodySchema,
  listWorkflowEventsQuerySchema,
  patientIdParamSchema,
  updateWorkflowEventBodySchema,
  updateWorkflowEventStatusBodySchema,
  workflowEventIdParamSchema,
} from "./validator.js";

export class WorkflowEventController {
  constructor(private readonly service: WorkflowEventService) {}

  listWorkflowEvents = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = listWorkflowEventsQuerySchema.parse(request.query);
      const data = await this.service.listWorkflowEvents(query);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Workflow events retrieved successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  listWorkflowEventsByPatient = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    try {
      const { patientId } = patientIdParamSchema.parse(request.params);
      const query = listWorkflowEventsQuerySchema.parse(request.query);
      const data = await this.service.listWorkflowEventsByPatient(
        patientId,
        query,
      );

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Patient workflow events retrieved successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  getWorkflowEventById = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    try {
      const { id } = workflowEventIdParamSchema.parse(request.params);
      const data = await this.service.getWorkflowEventById(id);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Workflow event retrieved successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  createWorkflowEvent = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = createWorkflowEventBodySchema.parse(request.body);
      const data = await this.service.createWorkflowEvent(body);

      return sendSuccess(
        reply,
        HttpStatus.CREATED,
        "Workflow event created successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  updateWorkflowEvent = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = workflowEventIdParamSchema.parse(request.params);
      const body = updateWorkflowEventBodySchema.parse(request.body);

      if (Object.keys(body).length === 0) {
        return sendError(
          reply,
          HttpStatus.BAD_REQUEST,
          "At least one field is required to update a workflow event",
          "Empty update payload",
        );
      }

      const data = await this.service.updateWorkflowEvent(id, body);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Workflow event updated successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  updateWorkflowEventStatus = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    try {
      const { id } = workflowEventIdParamSchema.parse(request.params);
      const body = updateWorkflowEventStatusBodySchema.parse(request.body);
      const data = await this.service.updateWorkflowEventStatus(id, body);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Workflow event status updated successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  private handleError(reply: FastifyReply, error: unknown) {
    if (error instanceof ZodError) {
      return sendError(
        reply,
        HttpStatus.BAD_REQUEST,
        "Validation failed",
        error.flatten(),
      );
    }

    if (error instanceof AppError) {
      return sendError(reply, error.statusCode, error.message, error.error);
    }

    return sendError(
      reply,
      HttpStatus.INTERNAL_SERVER_ERROR,
      "An unexpected error occurred",
      error instanceof Error ? error.message : error,
    );
  }
}
