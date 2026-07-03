import type { PrismaClient } from "@prisma/client";
import { prisma } from "../../database/index.js";
import { TaskController } from "./controller.js";
import { TaskRepository } from "./repository.js";
import { registerTaskRoutes } from "./routes.js";
import { TaskService } from "./service.js";

export function createTaskModule(db: PrismaClient = prisma) {
  const repository = new TaskRepository(db);
  const service = new TaskService(repository);
  const controller = new TaskController(service);

  return {
    repository,
    service,
    controller,
    registerRoutes: (app: Parameters<typeof registerTaskRoutes>[0]) =>
      registerTaskRoutes(app, controller),
  };
}

export const taskModule = createTaskModule();

export {
  TaskController,
  TaskRepository,
  TaskService,
  registerTaskRoutes,
};

export type {
  CreateTaskInput,
  TaskDetailDto,
  TaskListQuery,
  TaskSummaryDto,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from "./types.js";
