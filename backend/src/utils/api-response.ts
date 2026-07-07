import type { FastifyReply } from "fastify";
import { jsonResponse } from "./http.js";

export function sendSuccess<T>(
  reply: FastifyReply,
  statusCode: number,
  message: string,
  data: T,
) {
  return jsonResponse(reply, statusCode, {
    success: true,
    message,
    data,
  });
}

export function sendError(
  reply: FastifyReply,
  statusCode: number,
  message: string,
  error?: unknown,
) {
  return jsonResponse(reply, statusCode, {
    success: false,
    message,
    error: error ?? message,
  });
}
