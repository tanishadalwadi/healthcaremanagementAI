/**
 * auth.tsx — client-side auth context for Pulse demo.
 *
 * Three hardcoded accounts — no real backend. When a backend exists,
 * replace the DEMO_ACCOUNTS check in login() with a fetch() call.
 *
 * Session is stored in localStorage under "pulse_session". This is
 * intentionally simple — this is a portfolio demo, not a secure product.
 *
 * Demo accounts (shown on /login):
 *   nurse@pulse.health   / nurse123    → /nurse
 *   doctor@pulse.health  / doctor123   → /doctor
 *   admin@pulse.health   / admin123    → /admin
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

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = "nurse" | "doctor" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  /** For nurse: the nurse ID used in CareTeamAssignment */
  nurseId?: string;
  /** For doctor: the doctor ID used in CareTeamAssignment */
  doctorId?: string;
}

// ─── Mock accounts ────────────────────────────────────────────────────────────

export const DEMO_ACCOUNTS: Array<
  AuthUser & { password: string; homeRoute: string; subtitle: string }
> = [
  {
    id: "user-nurse",
    name: "Rachel Green",
    role: "nurse",
    email: "nurse@pulse.health",
    password: "nurse123",
    nurseId: "n1", // maps to NURSES[0] in generator — Rivera, J. (Day shift)
    homeRoute: "/nurse",
    subtitle: "Charge nurse · Day shift",
  },
  {
    id: "user-doctor",
    name: "Dr. Kwame Osei",
    role: "doctor",
    email: "doctor@pulse.health",
    password: "doctor123",
    doctorId: "d1", // maps to DOCTORS[0] in generator
    homeRoute: "/doctor",
    subtitle: "Attending · Cardiology",
  },
  {
    id: "user-admin",
    name: "Morgan Hayes",
    role: "admin",
    email: "admin@pulse.health",
    password: "admin123",
    homeRoute: "/admin",
    subtitle: "Hospital Administrator",
  },
];

const SESSION_KEY = "pulse_session";

// ─── Context ──────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null;
  /** Returns null on success, error message string on failure */
  login: (email: string, password: string) => string | null;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthUser;
        setUser(parsed);
      }
    } catch {
      // Corrupted storage — clear it
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    (email: string, password: string): string | null => {
      const account = DEMO_ACCOUNTS.find(
        (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
      );
      if (!account) return "Invalid email or password.";

      const sessionUser: AuthUser = {
        id: account.id,
        name: account.name,
        role: account.role,
        email: account.email,
        nurseId: account.nurseId,
        doctorId: account.doctorId,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
      return null;
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() must be used inside <AuthProvider>");
  return ctx;
}

/** Home route for each role — used in redirects */
export function homeRouteForRole(role: UserRole): string {
  const account = DEMO_ACCOUNTS.find((a) => a.role === role);
  return account?.homeRoute ?? "/login";
}
