import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./database/index.js";

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

export async function startServer(): Promise<void> {
  let app;

  try {
    await connectDatabase();
    app = await buildApp();
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`Pulse backend listening on http://${env.HOST}:${env.PORT}`);
    app.log.info("Database connected");

    const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];

    for (const signal of signals) {
      process.on(signal, () => {
        void shutdown(app!)
          .then(() => process.exit(0))
          .catch((error: unknown) => {
            app!.log.error({ err: error }, "Error during shutdown");
            process.exit(1);
          });
      });
    }
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
