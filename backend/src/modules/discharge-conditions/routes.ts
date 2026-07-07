import type { FastifyInstance } from "fastify";
import type { DischargeConditionController } from "./controller.js";

export async function registerDischargeConditionRoutes(
  app: FastifyInstance,
  controller: DischargeConditionController,
): Promise<void> {
  app.get(
    "/patients/:patientId/discharge-conditions",
    controller.listByPatient,
  );
  app.patch("/discharge-conditions/:id", controller.updateStatus);
}
