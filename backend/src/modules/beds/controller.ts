import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../../errors/app-error.js";
import { sendError, sendSuccess } from "../../utils/api-response.js";
import { HttpStatus } from "../../utils/http.js";
import type { BedService } from "./service.js";
import {
  assignBedBodySchema,
  bedIdParamSchema,
  listBedsQuerySchema,
} from "./validator.js";

export class BedController {
  constructor(private readonly service: BedService) {}

  listBeds = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = listBedsQuerySchema.parse(request.query);
      const data = await this.service.listBeds(query);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Beds retrieved successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  assignBed = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = bedIdParamSchema.parse(request.params);
      const body = assignBedBodySchema.parse(request.body);
      const data = await this.service.assignBed(id, body);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Bed assigned successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  releaseBed = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = bedIdParamSchema.parse(request.params);
      const data = await this.service.releaseBed(id);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Bed released successfully",
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
