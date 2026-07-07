import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../../errors/app-error.js";
import { sendError, sendSuccess } from "../../utils/api-response.js";
import { HttpStatus } from "../../utils/http.js";
import type { AiService } from "./service.js";
import {
  askPulseBodySchema,
  handoffBodySchema,
  insightsBodySchema,
  patientIdParamSchema,
} from "./validator.js";

export class AiController {
  constructor(private readonly service: AiService) {}

  getPatientSummary = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { patientId } = patientIdParamSchema.parse(request.params);
      const data = await this.service.getPatientSummary(patientId);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "AI summary generated successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  askPulse = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = askPulseBodySchema.parse(request.body);
      const data = await this.service.askPulse(
        body.question,
        body.scope,
        request.user.sub,
        request.user.role,
        body.patientId,
      );

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Ask Pulse response generated successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  getInsights = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = insightsBodySchema.parse(request.body);
      const data = await this.service.getInsights(
        body.scope,
        request.user.sub,
        request.user.role,
      );

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "AI insights generated successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  getWorkflowReplay = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { patientId } = patientIdParamSchema.parse(request.params);
      const data = await this.service.getWorkflowReplay(patientId);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Workflow replay generated successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  getShiftHandoff = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = handoffBodySchema.parse(request.body);
      const data = await this.service.getShiftHandoff(
        body.scope,
        request.user.sub,
        request.user.role,
      );

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Shift handoff generated successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  getPredictiveBottlenecks = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    try {
      const data = await this.service.getPredictiveBottlenecks(request.user.role);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Predictive bottlenecks generated successfully",
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
