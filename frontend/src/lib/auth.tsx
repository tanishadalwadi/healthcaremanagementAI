/**
 * auth.tsx — JWT session via backend /auth/login + /auth/me.
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

/** Shown on login page — aliases map to real backend users in auth service. */
export const DEMO_ACCOUNTS: Array<
  AuthUser & { password: string; homeRoute: string; subtitle: string }
> = [
  {
    id: "demo-nurse",
    name: "Amanda Brooks",
    role: "nurse",
    email: "nurse@pulse.health",
    password: "nurse123",
    nurseId: "demo",
    homeRoute: "/nurse",
    subtitle: "Charge nurse · Day shift",
  },
  {
    id: "demo-doctor",
    name: "Dr. Anna Rivera",
    role: "doctor",
    email: "doctor@pulse.health",
    password: "doctor123",
    doctorId: "demo",
    homeRoute: "/doctor",
    subtitle: "Attending · Cardiology",
  },
  {
    id: "demo-admin",
    name: "Alex Morgan",
    role: "admin",
    email: "admin@pulse.health",
    password: "admin123",
    homeRoute: "/admin",
    subtitle: "Hospital Administrator",
  },
];

const SESSION_KEY = "pulse_session";

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
  login: (email: string, password: string) => Promise<string | null>;
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
    async (email: string, password: string): Promise<string | null> => {
      try {
        const { user: profile } = await apiLogin(email.trim(), password);
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

  const logout = useCallback(() => {
    setAuthToken(null);
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
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
  const account = DEMO_ACCOUNTS.find((a) => a.role === role);
  return account?.homeRoute ?? "/login";
}
