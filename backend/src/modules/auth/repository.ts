import type { PrismaClient } from "@prisma/client";
import { verifyPassword } from "../../utils/password.js";

const LOGIN_ALIASES: Record<string, string> = {
  "nurse@pulse.health": "amanda.nurse@pulse.com",
  "doctor@pulse.health": "arivera.doctor@pulse.com",
  "admin@pulse.health": "alex.admin@pulse.com",
};

const ROLE_FALLBACK_EMAIL: Record<string, string> = {
  NURSE: "amanda.nurse@pulse.com",
  DOCTOR: "arivera.doctor@pulse.com",
  ADMIN: "alex.admin@pulse.com",
};

export interface AuthUserRecord {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "NURSE" | "DOCTOR";
  passwordHash: string | null;
  active: boolean;
}

export class AuthRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    const resolved = LOGIN_ALIASES[email.toLowerCase()] ?? email.toLowerCase();

    return this.db.user.findFirst({
      where: { email: { equals: resolved, mode: "insensitive" } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        passwordHash: true,
        active: true,
      },
    });
  }

  async findById(id: string): Promise<AuthUserRecord | null> {
    return this.db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        passwordHash: true,
        active: true,
      },
    });
  }

  async findFallbackByRole(role: "NURSE" | "DOCTOR" | "ADMIN") {
    const email = ROLE_FALLBACK_EMAIL[role];
    if (!email) return null;
    return this.findByEmail(email);
  }

  async updatePasswordHash(userId: string, passwordHash: string) {
    return this.db.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  verifyPassword(password: string, passwordHash: string | null): boolean {
    if (!passwordHash) return false;
    return verifyPassword(password, passwordHash);
  }
}
