import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../../errors/app-error.js";
import { sendError, sendSuccess } from "../../utils/api-response.js";
import { HttpStatus } from "../../utils/http.js";
import type { ConsultationService } from "./service.js";
import {
  consultationIdParamSchema,
  createConsultationBodySchema,
  listConsultationsQuerySchema,
  patientIdParamSchema,
  updateConsultationBodySchema,
  updateConsultationStatusBodySchema,
} from "./validator.js";

export class ConsultationController {
  constructor(private readonly service: ConsultationService) {}

  listConsultations = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = listConsultationsQuerySchema.parse(request.query);
      const data = await this.service.listConsultations(query);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Consultations retrieved successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  listConsultationsByPatient = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    try {
      const { patientId } = patientIdParamSchema.parse(request.params);
      const query = listConsultationsQuerySchema.parse(request.query);
      const data = await this.service.listConsultationsByPatient(patientId, query);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Patient consultations retrieved successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  getConsultationById = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = consultationIdParamSchema.parse(request.params);
      const data = await this.service.getConsultationById(id);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Consultation retrieved successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  createConsultation = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = createConsultationBodySchema.parse(request.body);
      const data = await this.service.createConsultation(body);

      return sendSuccess(
        reply,
        HttpStatus.CREATED,
        "Consultation created successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  updateConsultation = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = consultationIdParamSchema.parse(request.params);
      const body = updateConsultationBodySchema.parse(request.body);

      if (Object.keys(body).length === 0) {
        return sendError(
          reply,
          HttpStatus.BAD_REQUEST,
          "At least one field is required to update a consultation",
          "Empty update payload",
        );
      }

      const data = await this.service.updateConsultation(id, body);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Consultation updated successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  updateConsultationStatus = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    try {
      const { id } = consultationIdParamSchema.parse(request.params);
      const body = updateConsultationStatusBodySchema.parse(request.body);
      const data = await this.service.updateConsultationStatus(id, body);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Consultation status updated successfully",
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
