import type { PrismaClient } from "@prisma/client";
import { prisma } from "../../database/index.js";
import { DepartmentController } from "./controller.js";
import { DepartmentRepository } from "./repository.js";
import { registerDepartmentRoutes } from "./routes.js";
import { DepartmentService } from "./service.js";

export function createDepartmentModule(db: PrismaClient = prisma) {
  const repository = new DepartmentRepository(db);
  const service = new DepartmentService(repository);
  const controller = new DepartmentController(service);

  return {
    repository,
    service,
    controller,
    registerRoutes: (app: Parameters<typeof registerDepartmentRoutes>[0]) =>
      registerDepartmentRoutes(app, controller),
  };
}

export const departmentModule = createDepartmentModule();

export {
  DepartmentController,
  DepartmentRepository,
  DepartmentService,
  registerDepartmentRoutes,
};

export type {
  CreateDepartmentInput,
  DepartmentDetailDto,
  DepartmentListQuery,
  DepartmentSummaryDto,
  UpdateDepartmentInput,
} from "./types.js";
