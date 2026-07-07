import type { FastifyInstance } from "fastify";
import { aiModule } from "../modules/ai/index.js";
import { ambulanceModule } from "../modules/ambulances/index.js";
import { bedModule } from "../modules/beds/index.js";
import { consultationModule } from "../modules/consultations/index.js";
import { authModule } from "../modules/auth/index.js";
import { departmentModule } from "../modules/departments/index.js";
import { dischargeConditionModule } from "../modules/discharge-conditions/index.js";
import { notificationModule } from "../modules/notifications/index.js";
import { patientModule } from "../modules/patients/index.js";
import { taskModule } from "../modules/tasks/index.js";
import { userModule } from "../modules/users/index.js";
import { vitalSignModule } from "../modules/vitals/index.js";
import { workflowEventModule } from "../modules/workflow-events/index.js";
import { registerApiRoutes } from "./api.routes.js";
import { registerHealthRoutes } from "./health.routes.js";

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await registerApiRoutes(app);
  await registerHealthRoutes(app);
  await authModule.registerRoutes(app);
  await departmentModule.registerRoutes(app);
  await userModule.registerRoutes(app);
  await patientModule.registerRoutes(app);
  await consultationModule.registerRoutes(app);
  await workflowEventModule.registerRoutes(app);
  await vitalSignModule.registerRoutes(app);
  await taskModule.registerRoutes(app);
  await notificationModule.registerRoutes(app);
  await bedModule.registerRoutes(app);
  await ambulanceModule.registerRoutes(app);
  await dischargeConditionModule.registerRoutes(app);
  await aiModule.registerRoutes(app);
}
