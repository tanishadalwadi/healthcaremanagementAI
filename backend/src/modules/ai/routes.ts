import type { FastifyInstance } from "fastify";
import type { AiController } from "./controller.js";

export async function registerAiRoutes(
  app: FastifyInstance,
  controller: AiController,
): Promise<void> {
  app.get("/patients/:patientId/ai-summary", controller.getPatientSummary);
  app.get("/patients/:patientId/ai-workflow-replay", controller.getWorkflowReplay);
  app.post("/ai/ask", controller.askPulse);
  app.post("/ai/insights", controller.getInsights);
  app.post("/ai/handoff", controller.getShiftHandoff);
  app.get("/ai/predict-bottlenecks", controller.getPredictiveBottlenecks);
}
