import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../../errors/app-error.js";
import { sendError, sendSuccess } from "../../utils/api-response.js";
import { HttpStatus } from "../../utils/http.js";
import type { DischargeConditionService } from "./service.js";
import {
  dischargeConditionIdParamSchema,
  patientIdParamSchema,
  updateDischargeConditionBodySchema,
} from "./validator.js";

export class DischargeConditionController {
  constructor(private readonly service: DischargeConditionService) {}

  listByPatient = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { patientId } = patientIdParamSchema.parse(request.params);
      const data = await this.service.listByPatient(patientId);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Discharge conditions retrieved successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  updateStatus = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = dischargeConditionIdParamSchema.parse(request.params);
      const body = updateDischargeConditionBodySchema.parse(request.body);
      const data = await this.service.updateStatus(id, body);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Discharge condition updated successfully",
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
