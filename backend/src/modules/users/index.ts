import type { PrismaClient } from "@prisma/client";
import { prisma } from "../../database/index.js";
import { UserController } from "./controller.js";
import { UserRepository } from "./repository.js";
import { registerUserRoutes } from "./routes.js";
import { UserService } from "./service.js";

export function createUserModule(db: PrismaClient = prisma) {
  const repository = new UserRepository(db);
  const service = new UserService(repository);
  const controller = new UserController(service);

  return {
    repository,
    service,
    controller,
    registerRoutes: (app: Parameters<typeof registerUserRoutes>[0]) =>
      registerUserRoutes(app, controller),
  };
}

export const userModule = createUserModule();

export {
  UserController,
  UserRepository,
  UserService,
  registerUserRoutes,
};

export type {
  CreateUserInput,
  UpdateUserInput,
  UpdateUserStatusInput,
  UserDetailDto,
  UserListQuery,
  UserSummaryDto,
} from "./types.js";
