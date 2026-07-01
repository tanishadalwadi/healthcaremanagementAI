import { startServer } from "./server.js";

startServer().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown startup error";
  console.error(`[pulse-backend] Fatal error during startup: ${message}`);
  process.exit(1);
});
