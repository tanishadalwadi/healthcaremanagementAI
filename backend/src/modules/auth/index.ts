import type { PrismaClient } from "@prisma/client";
import { prisma } from "../../database/index.js";
import { AuthController } from "./controller.js";
import { AuthRepository } from "./repository.js";
import { registerAuthRoutes } from "./routes.js";
import { AuthService } from "./service.js";

export function createAuthModule(db: PrismaClient = prisma) {
  const repository = new AuthRepository(db);
  const service = new AuthService(repository);
  const controller = new AuthController(service);

  return {
    repository,
    service,
    controller,
    registerRoutes: (app: Parameters<typeof registerAuthRoutes>[0]) =>
      registerAuthRoutes(app, controller),
  };
}

export const authModule = createAuthModule();
