import type { FastifyInstance } from "fastify";
import type { DepartmentController } from "./controller.js";

export async function registerDepartmentRoutes(
  app: FastifyInstance,
  controller: DepartmentController,
): Promise<void> {
  app.get("/departments", controller.listDepartments);
  app.get("/departments/:id", controller.getDepartmentById);
  app.post("/departments", controller.createDepartment);
  app.patch("/departments/:id", controller.updateDepartment);
  app.delete("/departments/:id", controller.deleteDepartment);
}
