import type { FastifyInstance } from "fastify";
import { registerHealthRoutes } from "./health.routes.js";

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await registerHealthRoutes(app);
}
