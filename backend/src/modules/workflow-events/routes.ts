import type { FastifyInstance } from "fastify";
import type { WorkflowEventController } from "./controller.js";

export async function registerWorkflowEventRoutes(
  app: FastifyInstance,
  controller: WorkflowEventController,
): Promise<void> {
  app.get("/workflow-events", controller.listWorkflowEvents);
  app.get(
    "/patients/:patientId/workflow-events",
    controller.listWorkflowEventsByPatient,
  );
  app.get("/workflow-events/:id", controller.getWorkflowEventById);
  app.post("/workflow-events", controller.createWorkflowEvent);
  app.patch(
    "/workflow-events/:id/status",
    controller.updateWorkflowEventStatus,
  );
  app.patch("/workflow-events/:id", controller.updateWorkflowEvent);
}
