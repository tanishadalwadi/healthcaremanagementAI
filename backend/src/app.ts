import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { AppError } from "./errors/app-error.js";
import { env } from "./config/env.js";
import { registerRoutes } from "./routes/index.js";
import { sendError } from "./utils/api-response.js";
import { HttpStatus, jsonResponse } from "./utils/http.js";
import "./types/fastify.d.js";

const PUBLIC_ROUTE_PREFIXES = ["/health", "/auth/login", "/"];

function isPublicRoute(url: string): boolean {
  const path = url.split("?")[0] ?? url;
  return PUBLIC_ROUTE_PREFIXES.some(
    (prefix) => path === prefix || (prefix !== "/" && path.startsWith(prefix)),
  );
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.IS_PRODUCTION ? "info" : "debug",
    },
  });

  await app.register(cors, {
    origin: env.CORS_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  });

  await app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  app.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        return sendError(reply, HttpStatus.UNAUTHORIZED, "Unauthorized");
      }
    },
  );

  app.addHook("onRequest", async (request, reply) => {
    if (request.method === "OPTIONS" || isPublicRoute(request.url)) {
      return;
    }

    try {
      await request.jwtVerify();
    } catch {
      return sendError(reply, HttpStatus.UNAUTHORIZED, "Unauthorized");
    }
  });

  app.setNotFoundHandler((_request, reply) => {
    return sendError(reply, HttpStatus.NOT_FOUND, "Route not found");
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    if (reply.sent) {
      return;
    }

    if (error instanceof AppError) {
      return sendError(reply, error.statusCode, error.message, error.error);
    }

    const message =
      error instanceof Error ? error.message : "Internal server error";

    return jsonResponse(reply, HttpStatus.INTERNAL_SERVER_ERROR, {
      success: false,
      message: env.IS_PRODUCTION ? "Internal server error" : message,
      error: env.IS_PRODUCTION ? "Internal server error" : message,
    });
  });

  await registerRoutes(app);

  return app;
}
