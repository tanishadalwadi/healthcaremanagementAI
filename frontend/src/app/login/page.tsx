"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, homeRouteForRole, type UserRole } from "@/lib/auth";

type AuthMode = "login" | "signup";

const ROLES: Array<{ id: UserRole; label: string; icon: string }> = [
  { id: "nurse", label: "Nurse", icon: "ti-nurse" },
  { id: "doctor", label: "Doctor", icon: "ti-stethoscope" },
  { id: "admin", label: "Admin", icon: "ti-shield-check" },
];

const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: "100%",
  boxSizing: "border-box",
  background: "#F6F1F1",
  border: `1.5px solid ${hasError ? "#DC2626" : "#E7E0E9"}`,
  borderRadius: 12,
  padding: "11px 14px",
  fontSize: 13,
  fontWeight: 500,
  fontFamily: "inherit",
  color: "#1D1B2E",
  outline: "none",
});

export default function LoginPage() {
  const { user, loading, login, register } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("login");
  const [role, setRole] = useState<UserRole>("nurse");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(homeRouteForRole(user.role));
    }
  }, [user, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const err =
      mode === "login"
        ? await login(email, password, role)
        : await register(name, email, password, role);

    if (err) {
      setError(err);
      setSubmitting(false);
      return;
    }

    router.push(homeRouteForRole(role));
  }

  if (loading) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F6F1F1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: 420, maxWidth: "100%" }}>
        <div
          style={{
            background: "#ffffff",
            borderRadius: 18,
            padding: "36px 36px 28px",
            boxShadow: "0 24px 60px -12px rgba(29,27,46,0.4)",
          }}
        >
          <div className="flex items-center" style={{ gap: 11, marginBottom: 6 }}>
            <span
              className="flex items-center justify-center shrink-0"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "#7C5FAE",
                color: "#fff",
                fontSize: 18,
              }}
              aria-hidden="true"
            >
              <span className="ti ti-activity-heartbeat" />
            </span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#1D1B2E",
              }}
            >
              Pulse
            </span>
          </div>

          <p style={{ fontSize: 13, fontWeight: 500, color: "#6B6474", margin: "4px 0 22px" }}>
            Sign in to your hospital workspace
          </p>

          {/* Login / Sign up toggle */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 6,
              background: "#F6F1F1",
              borderRadius: 12,
              padding: 4,
              marginBottom: 16,
            }}
          >
            {(["login", "signup"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item);
                  setError(null);
                }}
                style={{
                  border: "none",
                  borderRadius: 9,
                  padding: "9px 0",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  background: mode === item ? "#fff" : "transparent",
                  color: mode === item ? "#7C5FAE" : "#8A8394",
                  boxShadow: mode === item ? "0 1px 3px rgba(29,27,46,0.08)" : "none",
                }}
              >
                {item === "login" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          {/* Role selector */}
          <div style={{ marginBottom: 16 }}>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#8A8394",
                margin: "0 0 8px",
              }}
            >
              I am a
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {ROLES.map((item) => {
                const selected = role === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setRole(item.id);
                      setError(null);
                    }}
                    style={{
                      border: `1.5px solid ${selected ? "#7C5FAE" : "#E7E0E9"}`,
                      borderRadius: 12,
                      padding: "12px 8px",
                      background: selected ? "#EFE7F7" : "#fff",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      className={`ti ${item.icon}`}
                      style={{ fontSize: 18, color: selected ? "#7C5FAE" : "#8A8394" }}
                      aria-hidden="true"
                    />
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: selected ? "#7C5FAE" : "#6B6474",
                      }}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            {mode === "signup" && (
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                required
                autoComplete="name"
                style={inputStyle(Boolean(error))}
              />
            )}

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              required
              autoComplete="email"
              style={inputStyle(Boolean(error))}
            />

            <input
              type="password"
              placeholder={mode === "signup" ? "Password (min 6 characters)" : "Password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              required
              minLength={mode === "signup" ? 6 : 1}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              style={inputStyle(Boolean(error))}
            />

            {error && (
              <p style={{ fontSize: 12, fontWeight: 500, color: "#DC2626", margin: 0 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: 4,
                width: "100%",
                background: submitting ? "#A987CC" : "#7C5FAE",
                border: "none",
                borderRadius: 12,
                padding: "12px 0",
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                fontFamily: "inherit",
                cursor: submitting ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {submitting && (
                <span
                  className="ti ti-loader-2"
                  aria-hidden="true"
                  style={{ fontSize: 16, animation: "spin 0.7s linear infinite" }}
                />
              )}
              {submitting
                ? mode === "login"
                  ? "Signing in…"
                  : "Creating account…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>
        </div>

        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#8A8394",
            textAlign: "center",
            marginTop: 16,
            marginBottom: 0,
            lineHeight: 1.5,
          }}
        >
          Demo: nurse@pulse.health / nurse123 · doctor@pulse.health / doctor123 ·
          admin@pulse.health / admin123
        </p>
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
