import type { FastifyInstance } from "fastify";
import type { VitalSignController } from "./controller.js";

export async function registerVitalSignRoutes(
  app: FastifyInstance,
  controller: VitalSignController,
): Promise<void> {
  app.get("/patients/:patientId/vitals", controller.listByPatient);
  app.post("/patients/:patientId/vitals", controller.createForPatient);
}
