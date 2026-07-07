import type { FastifyInstance } from "fastify";
import { sendSuccess } from "../utils/api-response.js";
import { HttpStatus } from "../utils/http.js";

const API_INFO = {
  service: "pulse-backend",
  version: "0.0.0",
  docs: "https://github.com/tanishadalwadi/healthcaremanagementAI",
  endpoints: {
    health: "GET /health",
    patients: "GET|POST /patients, GET|PATCH|DELETE /patients/:id",
    departments: "GET|POST /departments, GET|PATCH|DELETE /departments/:id",
    users: "GET|POST /users, GET|PATCH /users/:id, PATCH /users/:id/status",
    consultations:
      "GET|POST /consultations, GET|PATCH /consultations/:id, PATCH /consultations/:id/status",
    workflowEvents:
      "GET|POST /workflow-events, GET|PATCH /workflow-events/:id, PATCH /workflow-events/:id/status",
    tasks: "GET|POST /tasks, GET|PATCH /tasks/:id, PATCH /tasks/:id/status",
  },
} as const;

export async function registerApiRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async (_request, reply) => {
    return sendSuccess(reply, HttpStatus.OK, "Pulse API", API_INFO);
  });
}
