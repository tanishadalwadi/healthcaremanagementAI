import type { PrismaClient } from "@prisma/client";
import { prisma } from "../../database/index.js";
import { PatientController } from "./controller.js";
import { PatientRepository } from "./repository.js";
import { registerPatientRoutes } from "./routes.js";
import { PatientService } from "./service.js";

export function createPatientModule(db: PrismaClient = prisma) {
  const repository = new PatientRepository(db);
  const service = new PatientService(repository);
  const controller = new PatientController(service);

  return {
    repository,
    service,
    controller,
    registerRoutes: (app: Parameters<typeof registerPatientRoutes>[0]) =>
      registerPatientRoutes(app, controller),
  };
}

export const patientModule = createPatientModule();

export {
  PatientController,
  PatientRepository,
  PatientService,
  registerPatientRoutes,
};

export type {
  CreatePatientInput,
  PatientDetailDto,
  PatientListQuery,
  PatientSummaryDto,
  UpdatePatientInput,
} from "./types.js";
