import type { FastifyInstance } from "fastify";
import type { TaskController } from "./controller.js";

export async function registerTaskRoutes(
  app: FastifyInstance,
  controller: TaskController,
): Promise<void> {
  app.get("/tasks", controller.listTasks);
  app.get("/patients/:patientId/tasks", controller.listTasksByPatient);
  app.get("/users/:assignedTo/tasks", controller.listTasksByAssignee);
  app.get("/tasks/:id", controller.getTaskById);
  app.post("/tasks", controller.createTask);
  app.patch("/tasks/:id/status", controller.updateTaskStatus);
  app.patch("/tasks/:id", controller.updateTask);
}
