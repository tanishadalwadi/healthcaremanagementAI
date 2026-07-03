import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../../errors/app-error.js";
import { sendError, sendSuccess } from "../../utils/api-response.js";
import { HttpStatus } from "../../utils/http.js";
import type { UserService } from "./service.js";
import {
  createUserBodySchema,
  listUsersQuerySchema,
  updateUserBodySchema,
  updateUserStatusBodySchema,
  userIdParamSchema,
} from "./validator.js";

export class UserController {
  constructor(private readonly service: UserService) {}

  listUsers = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = listUsersQuerySchema.parse(request.query);
      const data = await this.service.listUsers(query);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Users retrieved successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  getUserById = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = userIdParamSchema.parse(request.params);
      const data = await this.service.getUserById(id);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "User retrieved successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  createUser = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = createUserBodySchema.parse(request.body);
      const data = await this.service.createUser(body);

      return sendSuccess(
        reply,
        HttpStatus.CREATED,
        "User created successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  updateUser = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = userIdParamSchema.parse(request.params);
      const body = updateUserBodySchema.parse(request.body);

      if (Object.keys(body).length === 0) {
        return sendError(
          reply,
          HttpStatus.BAD_REQUEST,
          "At least one field is required to update a user",
          "Empty update payload",
        );
      }

      const data = await this.service.updateUser(id, body);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "User updated successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  updateUserStatus = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = userIdParamSchema.parse(request.params);
      const body = updateUserStatusBodySchema.parse(request.body);
      const data = await this.service.updateUserStatus(id, body);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "User status updated successfully",
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
