import "dotenv/config";

function parsePort(value: string | undefined, fallback: number): number {
  const port = Number(value ?? fallback);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: "${value ?? ""}". Expected an integer between 1 and 65535.`);
  }

  return port;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  HOST: process.env.HOST ?? "0.0.0.0",
  PORT: parsePort(process.env.PORT, 4000),
  IS_PRODUCTION: (process.env.NODE_ENV ?? "development") === "production",
  DATABASE_URL: requireEnv("DATABASE_URL"),
  DIRECT_URL: process.env.DIRECT_URL?.trim() || requireEnv("DATABASE_URL"),
} as const;

export type Env = typeof env;
