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

const DEFAULT_CORS_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
] as const;

function parseCorsOrigins(value: string | undefined): string[] {
  if (!value?.trim()) {
    return [...DEFAULT_CORS_ORIGINS];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  HOST: process.env.HOST ?? "0.0.0.0",
  PORT: parsePort(process.env.PORT, 4000),
  IS_PRODUCTION: (process.env.NODE_ENV ?? "development") === "production",
  CORS_ORIGINS: parseCorsOrigins(process.env.CORS_ORIGINS),
  DATABASE_URL: requireEnv("DATABASE_URL"),
  DIRECT_URL: process.env.DIRECT_URL?.trim() || requireEnv("DATABASE_URL"),
  JWT_SECRET:
    process.env.JWT_SECRET?.trim() ||
    "pulse-dev-jwt-secret-change-in-production",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY?.trim() || "",
  GEMINI_MODEL: process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash",
} as const;

export type Env = typeof env;
