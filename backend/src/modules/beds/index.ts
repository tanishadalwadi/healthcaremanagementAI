import type { PrismaClient } from "@prisma/client";
import { prisma } from "../../database/index.js";
import { BedController } from "./controller.js";
import { BedRepository } from "./repository.js";
import { registerBedRoutes } from "./routes.js";
import { BedService } from "./service.js";

export function createBedModule(db: PrismaClient = prisma) {
  const repository = new BedRepository(db);
  const service = new BedService(repository);
  const controller = new BedController(service);

  return {
    repository,
    service,
    controller,
    registerRoutes: (app: Parameters<typeof registerBedRoutes>[0]) =>
      registerBedRoutes(app, controller),
  };
}

export const bedModule = createBedModule();

export {
  BedController,
  BedRepository,
  BedService,
  registerBedRoutes,
};
