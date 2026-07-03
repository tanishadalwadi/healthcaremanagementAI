import type { FastifyInstance } from "fastify";
import type { PatientController } from "./controller.js";

export async function registerPatientRoutes(
  app: FastifyInstance,
  controller: PatientController,
): Promise<void> {
  app.get("/patients", controller.listPatients);
  app.get("/patients/:id", controller.getPatientById);
  app.post("/patients", controller.createPatient);
  app.patch("/patients/:id", controller.updatePatient);
  app.delete("/patients/:id", controller.deletePatient);
}
