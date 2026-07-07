import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../../errors/app-error.js";
import { sendError, sendSuccess } from "../../utils/api-response.js";
import { HttpStatus } from "../../utils/http.js";
import type { VitalSignService } from "./service.js";
import {
  createVitalSignBodySchema,
  listVitalSignsQuerySchema,
  patientIdParamSchema,
} from "./validator.js";

export class VitalSignController {
  constructor(private readonly service: VitalSignService) {}

  listByPatient = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { patientId } = patientIdParamSchema.parse(request.params);
      const query = listVitalSignsQuerySchema.parse(request.query);
      const data = await this.service.listByPatient(patientId, query);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Vital signs retrieved successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  createForPatient = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { patientId } = patientIdParamSchema.parse(request.params);
      const body = createVitalSignBodySchema.parse(request.body);
      const data = await this.service.createForPatient(patientId, body);

      return sendSuccess(
        reply,
        HttpStatus.CREATED,
        "Vital signs recorded successfully",
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
