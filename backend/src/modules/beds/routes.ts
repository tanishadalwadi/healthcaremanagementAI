import type { FastifyInstance } from "fastify";
import type { BedController } from "./controller.js";

export async function registerBedRoutes(
  app: FastifyInstance,
  controller: BedController,
): Promise<void> {
  app.get("/beds", controller.listBeds);
  app.patch("/beds/:id/assign", controller.assignBed);
  app.patch("/beds/:id/release", controller.releaseBed);
}
