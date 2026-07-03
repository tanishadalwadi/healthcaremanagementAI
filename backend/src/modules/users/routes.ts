import type { FastifyInstance } from "fastify";
import type { UserController } from "./controller.js";

export async function registerUserRoutes(
  app: FastifyInstance,
  controller: UserController,
): Promise<void> {
  app.get("/users", controller.listUsers);
  app.get("/users/:id", controller.getUserById);
  app.post("/users", controller.createUser);
  app.patch("/users/:id/status", controller.updateUserStatus);
  app.patch("/users/:id", controller.updateUser);
}
