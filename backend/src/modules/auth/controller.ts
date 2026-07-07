import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../../errors/app-error.js";
import { sendError, sendSuccess } from "../../utils/api-response.js";
import { HttpStatus } from "../../utils/http.js";
import type { AuthService } from "./service.js";
import { loginBodySchema } from "./validator.js";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  login = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = loginBodySchema.parse(request.body);
      const user = await this.service.login(body);
      const token = await reply.jwtSign({
        sub: user.id,
        email: user.email,
        role: user.role.toUpperCase() as "ADMIN" | "NURSE" | "DOCTOR",
      });

      return sendSuccess(reply, HttpStatus.OK, "Login successful", {
        token,
        user,
      });
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  me = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user.sub;
      const user = await this.service.getProfile(userId);
      return sendSuccess(reply, HttpStatus.OK, "Profile retrieved", user);
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
