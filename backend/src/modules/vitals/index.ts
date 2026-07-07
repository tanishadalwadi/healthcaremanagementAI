import type { PrismaClient } from "@prisma/client";
import { prisma } from "../../database/index.js";
import { VitalSignController } from "./controller.js";
import { VitalSignRepository } from "./repository.js";
import { registerVitalSignRoutes } from "./routes.js";
import { VitalSignService } from "./service.js";

export function createVitalSignModule(db: PrismaClient = prisma) {
  const repository = new VitalSignRepository(db);
  const service = new VitalSignService(repository);
  const controller = new VitalSignController(service);

  return {
    repository,
    service,
    controller,
    registerRoutes: (app: Parameters<typeof registerVitalSignRoutes>[0]) =>
      registerVitalSignRoutes(app, controller),
  };
}

export const vitalSignModule = createVitalSignModule();

export {
  VitalSignController,
  VitalSignRepository,
  VitalSignService,
  registerVitalSignRoutes,
};
