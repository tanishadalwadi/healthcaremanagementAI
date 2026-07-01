import Fastify, { type FastifyInstance } from "fastify";
import { env } from "./config/env.js";
import { registerRoutes } from "./routes/index.js";
import { HttpStatus, jsonResponse } from "./utils/http.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.IS_PRODUCTION ? "info" : "debug",
    },
  });

  app.setNotFoundHandler((_request, reply) => {
    return jsonResponse(reply, HttpStatus.NOT_FOUND, {
      status: "error",
      message: "Route not found",
    });
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    if (reply.sent) {
      return;
    }

    const message =
      error instanceof Error ? error.message : "Internal server error";

    return jsonResponse(reply, HttpStatus.INTERNAL_SERVER_ERROR, {
      status: "error",
      message: env.IS_PRODUCTION ? "Internal server error" : message,
    });
  });

  await registerRoutes(app);

  return app;
}
