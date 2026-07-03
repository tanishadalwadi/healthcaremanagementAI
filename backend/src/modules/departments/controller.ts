import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../../errors/app-error.js";
import { sendError, sendSuccess } from "../../utils/api-response.js";
import { HttpStatus } from "../../utils/http.js";
import type { DepartmentService } from "./service.js";
import {
  createDepartmentBodySchema,
  departmentIdParamSchema,
  listDepartmentsQuerySchema,
  updateDepartmentBodySchema,
} from "./validator.js";

export class DepartmentController {
  constructor(private readonly service: DepartmentService) {}

  listDepartments = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = listDepartmentsQuerySchema.parse(request.query);
      const data = await this.service.listDepartments(query);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Departments retrieved successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  getDepartmentById = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = departmentIdParamSchema.parse(request.params);
      const data = await this.service.getDepartmentById(id);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Department retrieved successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  createDepartment = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = createDepartmentBodySchema.parse(request.body);
      const data = await this.service.createDepartment(body);

      return sendSuccess(
        reply,
        HttpStatus.CREATED,
        "Department created successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  updateDepartment = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = departmentIdParamSchema.parse(request.params);
      const body = updateDepartmentBodySchema.parse(request.body);

      if (Object.keys(body).length === 0) {
        return sendError(
          reply,
          HttpStatus.BAD_REQUEST,
          "At least one field is required to update a department",
          "Empty update payload",
        );
      }

      const data = await this.service.updateDepartment(id, body);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Department updated successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  deleteDepartment = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = departmentIdParamSchema.parse(request.params);
      const data = await this.service.deleteDepartment(id);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Department deleted successfully",
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
