import type { PrismaClient } from "@prisma/client";
import { prisma } from "../../database/index.js";
import { AiController } from "./controller.js";
import { AiRepository } from "./repository.js";
import { registerAiRoutes } from "./routes.js";
import { AiService } from "./service.js";

export function createAiModule(db: PrismaClient = prisma) {
  const repository = new AiRepository(db);
  const service = new AiService(repository);
  const controller = new AiController(service);

  return {
    repository,
    service,
    controller,
    registerRoutes: (app: Parameters<typeof registerAiRoutes>[0]) =>
      registerAiRoutes(app, controller),
  };
}

export const aiModule = createAiModule();

export { AiController, AiRepository, AiService, registerAiRoutes };
