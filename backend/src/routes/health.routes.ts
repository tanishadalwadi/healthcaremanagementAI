import type { FastifyInstance } from "fastify";
import { HttpStatus, jsonResponse } from "../utils/http.js";

const HEALTH_RESPONSE = {
  status: "ok",
  service: "pulse-backend",
} as const;

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async (_request, reply) => {
    return jsonResponse(reply, HttpStatus.OK, HEALTH_RESPONSE);
  });
}
