import type { PrismaClient } from "@prisma/client";
import { prisma } from "../../database/index.js";
import { DischargeConditionController } from "./controller.js";
import { DischargeConditionRepository } from "./repository.js";
import { registerDischargeConditionRoutes } from "./routes.js";
import { DischargeConditionService } from "./service.js";

export function createDischargeConditionModule(db: PrismaClient = prisma) {
  const repository = new DischargeConditionRepository(db);
  const service = new DischargeConditionService(repository);
  const controller = new DischargeConditionController(service);

  return {
    repository,
    service,
    controller,
    registerRoutes: (app: Parameters<typeof registerDischargeConditionRoutes>[0]) =>
      registerDischargeConditionRoutes(app, controller),
  };
}

export const dischargeConditionModule = createDischargeConditionModule();

export {
  DischargeConditionController,
  DischargeConditionRepository,
  DischargeConditionService,
  registerDischargeConditionRoutes,
};
