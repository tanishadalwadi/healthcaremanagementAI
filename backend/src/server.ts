import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./database/index.js";

const globalForServer = globalThis as typeof globalThis & {
  isShuttingDown?: boolean;
};

function formatStartupError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown startup error";
}

async function shutdown(app: Awaited<ReturnType<typeof buildApp>>): Promise<void> {
  await app.close();
  await disconnectDatabase();
}

function registerShutdownHandlers(
  app: Awaited<ReturnType<typeof buildApp>>,
): void {
  const handleShutdown = (signal: NodeJS.Signals) => {
    if (globalForServer.isShuttingDown) {
      return;
    }

    globalForServer.isShuttingDown = true;
    app.log.info(`Received ${signal}, shutting down...`);

    void shutdown(app)
      .then(() => {
        process.exit(0);
      })
      .catch((error: unknown) => {
        app.log.error({ err: error }, "Error during shutdown");
        process.exit(1);
      });

    setTimeout(() => {
      app.log.error("Forced shutdown after timeout");
      process.exit(1);
    }, 3000).unref();
  };

  process.removeAllListeners("SIGINT");
  process.removeAllListeners("SIGTERM");
  process.once("SIGINT", () => handleShutdown("SIGINT"));
  process.once("SIGTERM", () => handleShutdown("SIGTERM"));
}

export async function startServer(): Promise<void> {
  let app;

  try {
    globalForServer.isShuttingDown = false;
    await connectDatabase();
    app = await buildApp();
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`Pulse backend listening on http://${env.HOST}:${env.PORT}`);
    app.log.info("Database connected");
    registerShutdownHandlers(app);
  } catch (error) {
    const message = formatStartupError(error);

    if (app) {
      app.log.fatal({ err: error }, message);
    } else {
      console.error(`[pulse-backend] Failed to start: ${message}`);
    }

    await disconnectDatabase().catch(() => undefined);
    process.exit(1);
  }
}
