import type { FastifyInstance } from "fastify";
import { consultationModule } from "../modules/consultations/index.js";
import { departmentModule } from "../modules/departments/index.js";
import { patientModule } from "../modules/patients/index.js";
import { taskModule } from "../modules/tasks/index.js";
import { userModule } from "../modules/users/index.js";
import { workflowEventModule } from "../modules/workflow-events/index.js";
import { registerHealthRoutes } from "./health.routes.js";

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await registerHealthRoutes(app);
  await departmentModule.registerRoutes(app);
  await userModule.registerRoutes(app);
  await patientModule.registerRoutes(app);
  await consultationModule.registerRoutes(app);
  await workflowEventModule.registerRoutes(app);
  await taskModule.registerRoutes(app);
}
