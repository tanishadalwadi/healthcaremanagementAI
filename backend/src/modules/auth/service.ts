import { UnauthorizedError } from "../../errors/app-error.js";
import type { AuthRepository } from "./repository.js";

export interface LoginInput {
  email: string;
  password: string;
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

export class AuthService {
  constructor(private readonly repository: AuthRepository) {}

  async login(input: LoginInput): Promise<AuthUserDto> {
    let user = await this.repository.findByEmail(input.email);

    if (!user) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    if (!user.active) {
      throw new UnauthorizedError("This account is inactive.");
    }

    if (!this.repository.verifyPassword(input.password, user.passwordHash)) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: toFeRole(user.role),
    };
  }

  async getProfile(userId: string): Promise<AuthUserDto> {
    const user = await this.repository.findById(userId);

    if (!user || !user.active) {
      throw new UnauthorizedError("Session is no longer valid.");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: toFeRole(user.role),
    };
  }
}
