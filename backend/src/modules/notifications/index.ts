import type { PrismaClient } from "@prisma/client";
import { prisma } from "../../database/index.js";
import { NotificationController } from "./controller.js";
import { NotificationRepository } from "./repository.js";
import { registerNotificationRoutes } from "./routes.js";
import { NotificationService } from "./service.js";

export function createNotificationModule(db: PrismaClient = prisma) {
  const repository = new NotificationRepository(db);
  const service = new NotificationService(repository);
  const controller = new NotificationController(service);

  return {
    repository,
    service,
    controller,
    registerRoutes: (app: Parameters<typeof registerNotificationRoutes>[0]) =>
      registerNotificationRoutes(app, controller),
  };
}

export const notificationModule = createNotificationModule();

export {
  NotificationController,
  NotificationRepository,
  NotificationService,
  registerNotificationRoutes,
};
