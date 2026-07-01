import type { FastifyReply } from "fastify";

export const HttpStatus = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type JsonRecord = Record<string, unknown>;

export function jsonResponse<T extends JsonRecord>(
  reply: FastifyReply,
  statusCode: number,
  body: T,
) {
  return reply.code(statusCode).type("application/json").send(body);
}
