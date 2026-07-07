import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../../errors/app-error.js";
import { sendError, sendSuccess } from "../../utils/api-response.js";
import { HttpStatus } from "../../utils/http.js";
import type { NotificationService } from "./service.js";
import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
} from "./validator.js";

export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  listNotifications = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = listNotificationsQuerySchema.parse(request.query);
      const data = await this.service.listNotifications(query);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Notifications retrieved successfully",
        data,
      );
    } catch (error) {
      return this.handleError(reply, error);
    }
  };

  markRead = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = notificationIdParamSchema.parse(request.params);
      const data = await this.service.markRead(id);

      return sendSuccess(
        reply,
        HttpStatus.OK,
        "Notification marked as read",
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
