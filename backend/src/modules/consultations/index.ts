import type { PrismaClient } from "@prisma/client";
import { prisma } from "../../database/index.js";
import { ConsultationController } from "./controller.js";
import { ConsultationRepository } from "./repository.js";
import { registerConsultationRoutes } from "./routes.js";
import { ConsultationService } from "./service.js";

export function createConsultationModule(db: PrismaClient = prisma) {
  const repository = new ConsultationRepository(db);
  const service = new ConsultationService(repository);
  const controller = new ConsultationController(service);

  return {
    repository,
    service,
    controller,
    registerRoutes: (app: Parameters<typeof registerConsultationRoutes>[0]) =>
      registerConsultationRoutes(app, controller),
  };
}

export const consultationModule = createConsultationModule();

export {
  ConsultationController,
  ConsultationRepository,
  ConsultationService,
  registerConsultationRoutes,
};

export type {
  ConsultationDetailDto,
  ConsultationListQuery,
  ConsultationSummaryDto,
  CreateConsultationInput,
  UpdateConsultationInput,
  UpdateConsultationStatusInput,
} from "./types.js";
