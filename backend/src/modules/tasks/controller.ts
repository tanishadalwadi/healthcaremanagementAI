import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../../errors/app-error.js";
import { sendError, sendSuccess } from "../../utils/api-response.js";
import { HttpStatus } from "../../utils/http.js";
import type { TaskService } from "./service.js";
import {
  assigneeIdParamSchema,
  createTaskBodySchema,
  listTasksQuerySchema,
  patientIdParamSchema,
  taskIdParamSchema,
  updateTaskBodySchema,
  updateTaskStatusBodySchema,
} from "./validator.js";

export class TaskController {
  constructor(private readonly service: TaskService) {}

  listTasks = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = listTasksQuerySchema.parse(request.query);
      const data = await this.service.listTasks(query);

      return sendSuccess(reply, HttpStatus.OK, "Tasks retrieved successfully", data);
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  listTasksByPatient = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { patientId } = patientIdParamSchema.parse(request.params);
      const query = listTasksQuerySchema.parse(request.query);
      const data = await this.service.listTasksByPatient(patientId, query);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Patient tasks retrieved successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  listTasksByAssignee = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { assignedTo } = assigneeIdParamSchema.parse(request.params);
      const query = listTasksQuerySchema.parse(request.query);
      const data = await this.service.listTasksByAssignee(assignedTo, query);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Assignee tasks retrieved successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  getTaskById = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = taskIdParamSchema.parse(request.params);
      const data = await this.service.getTaskById(id);

      return sendSuccess(reply, HttpStatus.OK, "Task retrieved successfully", data);
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  createTask = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = createTaskBodySchema.parse(request.body);
      const data = await this.service.createTask(body);

      return sendSuccess(
        reply,
        HttpStatus.CREATED,
        "Task created successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  updateTask = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = taskIdParamSchema.parse(request.params);
      const body = updateTaskBodySchema.parse(request.body);

      if (Object.keys(body).length === 0) {
        return sendError(
          reply,
          HttpStatus.BAD_REQUEST,
          "At least one field is required to update a task",
          "Empty update payload",
        );
      }

      const data = await this.service.updateTask(id, body);

      return sendSuccess(reply, HttpStatus.OK, "Task updated successfully", data);
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  updateTaskStatus = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = taskIdParamSchema.parse(request.params);
      const body = updateTaskStatusBodySchema.parse(request.body);
      const data = await this.service.updateTaskStatus(id, body);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Task status updated successfully",
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
