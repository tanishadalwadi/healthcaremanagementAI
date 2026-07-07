import type { FastifyInstance } from "fastify";
import type { AmbulanceController } from "./controller.js";

export async function registerAmbulanceRoutes(
  app: FastifyInstance,
  controller: AmbulanceController,
): Promise<void> {
  app.get("/ambulances", controller.listAmbulances);
  app.patch("/ambulances/:id/status", controller.updateStatus);
}
