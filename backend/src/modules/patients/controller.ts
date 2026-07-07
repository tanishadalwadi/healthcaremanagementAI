import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../../errors/app-error.js";
import { sendError, sendSuccess } from "../../utils/api-response.js";
import { HttpStatus } from "../../utils/http.js";
import type { PatientService } from "./service.js";
import {
  createPatientBodySchema,
  listPatientsQuerySchema,
  patientIdParamSchema,
  updatePatientBodySchema,
  userIdParamSchema,
} from "./validator.js";

export class PatientController {
  constructor(private readonly service: PatientService) {}

  listPatients = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = listPatientsQuerySchema.parse(request.query);
      const data = await this.service.listPatients(query);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Patients retrieved successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  listPatientsByUser = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = userIdParamSchema.parse(request.params);
      const query = listPatientsQuerySchema.parse(request.query);
      const data = await this.service.listPatientsByUser(id, query);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "User patients retrieved successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  getPatientById = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = patientIdParamSchema.parse(request.params);
      const data = await this.service.getPatientById(id);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Patient retrieved successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  createPatient = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = createPatientBodySchema.parse(request.body);
      const data = await this.service.createPatient(body);

      return sendSuccess(
        reply,
        HttpStatus.CREATED,
        "Patient created successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  updatePatient = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = patientIdParamSchema.parse(request.params);
      const body = updatePatientBodySchema.parse(request.body);

      if (Object.keys(body).length === 0) {
        return sendError(
          reply,
          HttpStatus.BAD_REQUEST,
          "At least one field is required to update a patient",
          "Empty update payload",
        );
      }

      const data = await this.service.updatePatient(id, body);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Patient updated successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  deletePatient = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = patientIdParamSchema.parse(request.params);
      const data = await this.service.deletePatient(id);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Patient deleted successfully",
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
