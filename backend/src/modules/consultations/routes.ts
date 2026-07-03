import type { FastifyInstance } from "fastify";
import type { ConsultationController } from "./controller.js";

export async function registerConsultationRoutes(
  app: FastifyInstance,
  controller: ConsultationController,
): Promise<void> {
  app.get("/consultations", controller.listConsultations);
  app.get("/patients/:patientId/consultations", controller.listConsultationsByPatient);
  app.get("/consultations/:id", controller.getConsultationById);
  app.post("/consultations", controller.createConsultation);
  app.patch("/consultations/:id/status", controller.updateConsultationStatus);
  app.patch("/consultations/:id", controller.updateConsultation);
}
