import type { FastifyInstance } from "fastify";
import type { NotificationController } from "./controller.js";

export async function registerNotificationRoutes(
  app: FastifyInstance,
  controller: NotificationController,
): Promise<void> {
  app.get("/notifications", controller.listNotifications);
  app.patch("/notifications/:id/read", controller.markRead);
}
