import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed script for Pulse database.
 * TODO placeholders only — no fake data yet.
 */
async function main(): Promise<void> {
  // TODO: Seed admin, nurse, and doctor users
  // TODO: Seed departments
  // TODO: Seed patients with department assignments
  // TODO: Seed workflow steps per patient
  // TODO: Seed patient events
  // TODO: Seed tasks assigned to users
}

main()
  .catch((error: unknown) => {
    console.error("[pulse-backend] Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
