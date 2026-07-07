import type { FastifyInstance } from "fastify";
import type { AuthController } from "./controller.js";

export async function registerAuthRoutes(
  app: FastifyInstance,
  controller: AuthController,
): Promise<void> {
  app.post("/auth/login", controller.login);
  app.post("/auth/register", controller.register);
  app.get("/auth/me", { preHandler: [app.authenticate] }, controller.me);
}
