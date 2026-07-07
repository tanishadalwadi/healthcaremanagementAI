import type { PrismaClient } from "@prisma/client";
import { prisma } from "../../database/index.js";
import { AmbulanceController } from "./controller.js";
import { AmbulanceRepository } from "./repository.js";
import { registerAmbulanceRoutes } from "./routes.js";
import { AmbulanceService } from "./service.js";

export function createAmbulanceModule(db: PrismaClient = prisma) {
  const repository = new AmbulanceRepository(db);
  const service = new AmbulanceService(repository);
  const controller = new AmbulanceController(service);

  return {
    repository,
    service,
    controller,
    registerRoutes: (app: Parameters<typeof registerAmbulanceRoutes>[0]) =>
      registerAmbulanceRoutes(app, controller),
  };
}

export const ambulanceModule = createAmbulanceModule();

export {
  AmbulanceController,
  AmbulanceRepository,
  AmbulanceService,
  registerAmbulanceRoutes,
};
