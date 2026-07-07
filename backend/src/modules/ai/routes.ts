import type { FastifyInstance } from "fastify";
import type { AiController } from "./controller.js";

export async function registerAiRoutes(
  app: FastifyInstance,
  controller: AiController,
): Promise<void> {
  app.get("/patients/:patientId/ai-summary", controller.getPatientSummary);
}
