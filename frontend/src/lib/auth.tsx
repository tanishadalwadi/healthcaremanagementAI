/**
 * auth.tsx — JWT session via backend /auth/login + /auth/register + /auth/me.
 */

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  apiLogin,
  apiMe,
  apiRegister,
  getAuthToken,
  setAuthToken,
} from "@/lib/api-client";

export type UserRole = "nurse" | "doctor" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  nurseId?: string;
  doctorId?: string;
}

const SESSION_KEY = "pulse_session";

const HOME_ROUTES: Record<UserRole, string> = {
  nurse: "/nurse",
  doctor: "/doctor",
  admin: "/admin",
};

function toAuthUser(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    nurseId: user.role === "nurse" ? user.id : undefined,
    doctorId: user.role === "doctor" ? user.id : undefined,
  };
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (
    email: string,
    password: string,
    role: UserRole,
  ) => Promise<string | null>;
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
  ) => Promise<string | null>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const token = getAuthToken();
        if (!token) {
          localStorage.removeItem(SESSION_KEY);
          return;
        }

        const profile = await apiMe();
        const sessionUser = toAuthUser(profile);
        setUser(sessionUser);
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      } catch {
        setAuthToken(null);
        localStorage.removeItem(SESSION_KEY);
      } finally {
        setLoading(false);
      }
    }

    void restoreSession();
  }, []);

  const login = useCallback(
    async (
      email: string,
      password: string,
      role: UserRole,
    ): Promise<string | null> => {
      try {
        const { user: profile } = await apiLogin(email.trim(), password, role);
        const sessionUser = toAuthUser(profile);
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
        setUser(sessionUser);
        return null;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Invalid email or password.";
        return message;
      }
    },
    [],
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      role: UserRole,
    ): Promise<string | null> => {
      try {
        const { user: profile } = await apiRegister(
          name.trim(),
          email.trim(),
          password,
          role,
        );
        const sessionUser = toAuthUser(profile);
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
        setUser(sessionUser);
        return null;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not create account.";
        return message;
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setAuthToken(null);
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() must be used inside <AuthProvider>");
  return ctx;
}

export function homeRouteForRole(role: UserRole): string {
  return HOME_ROUTES[role] ?? "/login";
}
