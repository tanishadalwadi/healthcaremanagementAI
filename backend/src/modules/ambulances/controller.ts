import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../../errors/app-error.js";
import { sendError, sendSuccess } from "../../utils/api-response.js";
import { HttpStatus } from "../../utils/http.js";
import type { AmbulanceService } from "./service.js";
import {
  ambulanceIdParamSchema,
  listAmbulancesQuerySchema,
  updateAmbulanceStatusBodySchema,
} from "./validator.js";

export class AmbulanceController {
  constructor(private readonly service: AmbulanceService) {}

  listAmbulances = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = listAmbulancesQuerySchema.parse(request.query);
      const data = await this.service.listAmbulances(query);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Ambulances retrieved successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  updateStatus = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = ambulanceIdParamSchema.parse(request.params);
      const body = updateAmbulanceStatusBodySchema.parse(request.body);
      const data = await this.service.updateStatus(id, body);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Ambulance status updated successfully",
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
