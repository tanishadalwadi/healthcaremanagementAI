import type { PrismaClient } from "@prisma/client";
import { prisma } from "../../database/index.js";
import { WorkflowEventController } from "./controller.js";
import { WorkflowEventRepository } from "./repository.js";
import { registerWorkflowEventRoutes } from "./routes.js";
import { WorkflowEventService } from "./service.js";

export function createWorkflowEventModule(db: PrismaClient = prisma) {
  const repository = new WorkflowEventRepository(db);
  const service = new WorkflowEventService(repository);
  const controller = new WorkflowEventController(service);

  return {
    repository,
    service,
    controller,
    registerRoutes: (app: Parameters<typeof registerWorkflowEventRoutes>[0]) =>
      registerWorkflowEventRoutes(app, controller),
  };
}

export const workflowEventModule = createWorkflowEventModule();

export {
  WorkflowEventController,
  WorkflowEventRepository,
  WorkflowEventService,
  registerWorkflowEventRoutes,
};

export type {
  CreateWorkflowEventInput,
  UpdateWorkflowEventInput,
  UpdateWorkflowEventStatusInput,
  WorkflowEventDetailDto,
  WorkflowEventListQuery,
  WorkflowEventSummaryDto,
} from "./types.js";
