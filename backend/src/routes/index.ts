import type { FastifyInstance } from "fastify";
import { departmentModule } from "../modules/departments/index.js";
import { patientModule } from "../modules/patients/index.js";
import { registerHealthRoutes } from "./health.routes.js";

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await registerHealthRoutes(app);
  await departmentModule.registerRoutes(app);
  await patientModule.registerRoutes(app);
}
