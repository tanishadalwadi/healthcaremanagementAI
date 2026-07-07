import {
  ConflictError,
  UnauthorizedError,
} from "../../errors/app-error.js";
import { hashPassword } from "../../utils/password.js";
import type { AuthRepository } from "./repository.js";

export interface LoginInput {
  email: string;
  password: string;
  role: "admin" | "nurse" | "doctor";
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: "admin" | "nurse" | "doctor";
}

export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
  role: "admin" | "nurse" | "doctor";
}

function toFeRole(role: "ADMIN" | "NURSE" | "DOCTOR"): AuthUserDto["role"] {
  if (role === "ADMIN") return "admin";
  if (role === "DOCTOR") return "doctor";
  return "nurse";
}

function toDbRole(role: AuthUserDto["role"]): "ADMIN" | "NURSE" | "DOCTOR" {
  if (role === "admin") return "ADMIN";
  if (role === "doctor") return "DOCTOR";
  return "NURSE";
}

function toUserDto(user: {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "NURSE" | "DOCTOR";
}): AuthUserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: toFeRole(user.role),
  };
}

function assertRoleMatch(
  expected: AuthUserDto["role"],
  actual: AuthUserDto["role"],
): void {
  if (expected !== actual) {
    const label = expected.charAt(0).toUpperCase() + expected.slice(1);
    throw new UnauthorizedError(
      `This account is registered as ${actual}, not ${label}. Select the correct role.`,
    );
  }
}

export class AuthService {
  constructor(private readonly repository: AuthRepository) {}

  async login(input: LoginInput): Promise<AuthUserDto> {
    const user = await this.repository.findByEmail(input.email);

    if (!user) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    if (!user.active) {
      throw new UnauthorizedError("This account is inactive.");
    }

    if (!this.repository.verifyPassword(input.password, user.passwordHash)) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    const dto = toUserDto(user);
    assertRoleMatch(input.role, dto.role);
    return dto;
  }

  async register(input: RegisterInput): Promise<AuthUserDto> {
    const email = input.email.toLowerCase();
    const existing = await this.repository.findByEmail(email);

    if (existing) {
      throw new ConflictError("An account with this email already exists. Sign in instead.");
    }

    const user = await this.repository.createUser({
      name: input.name.trim(),
      email,
      passwordHash: hashPassword(input.password),
      role: toDbRole(input.role),
    });

    return toUserDto(user);
  }

  async getProfile(userId: string): Promise<AuthUserDto> {
    const user = await this.repository.findById(userId);

    if (!user || !user.active) {
      throw new UnauthorizedError("Session is no longer valid.");
    }

    return toUserDto(user);
  }
}
