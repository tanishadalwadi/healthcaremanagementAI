/**
 * Login page — /login
 *
 * Shows 3 demo credentials so anyone testing the app doesn't have
 * to memorize anything. On submit, validates against DEMO_ACCOUNTS,
 * calls auth.login(), then redirects to that role's home route.
 *
 * Visual spec: Pulse design system only — #F6F1F1 bg, #7C5FAE primary,
 * existing radius/typography tokens. No new hex values.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, DEMO_ACCOUNTS, homeRouteForRole } from "@/lib/auth";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect to home
  useEffect(() => {
    if (!loading && user) {
      router.replace(homeRouteForRole(user.role));
    }
  }, [user, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Tiny artificial delay so the loading state is visible
    await new Promise((r) => setTimeout(r, 400));

    const err = login(email.trim(), password);
    if (err) {
      setError(err);
      setSubmitting(false);
      return;
    }

    // login() sets the user in context; read the target role from DEMO_ACCOUNTS
    const account = DEMO_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase()
    );
    router.push(account?.homeRoute ?? "/nurse");
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
        {/* Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 18,
            padding: "36px 36px 28px",
            boxShadow: "0 24px 60px -12px rgba(29,27,46,0.4)",
          }}
        >
          {/* Logo + wordmark */}
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
              style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "#1D1B2E" }}
            >
              Pulse
            </span>
          </div>

          <p style={{ fontSize: 13, fontWeight: 500, color: "#6B6474", margin: "4px 0 26px" }}>
            Hospital workflow coordination
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Email */}
            <div style={{ position: "relative" }}>
              <span
                className="ti ti-mail"
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 13,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 16,
                  color: "#8A8394",
                  pointerEvents: "none",
                }}
              />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                required
                autoComplete="email"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#F6F1F1",
                  border: `1.5px solid ${error ? "#DC2626" : "#E7E0E9"}`,
                  borderRadius: 12,
                  padding: "11px 14px 11px 38px",
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "inherit",
                  color: "#1D1B2E",
                  outline: "none",
                }}
                onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = "#7C5FAE"; }}
                onBlur={(e) => { if (!error) e.currentTarget.style.borderColor = "#E7E0E9"; }}
              />
            </div>

            {/* Password */}
            <div style={{ position: "relative" }}>
              <span
                className="ti ti-lock"
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 13,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 16,
                  color: "#8A8394",
                  pointerEvents: "none",
                }}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                required
                autoComplete="current-password"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#F6F1F1",
                  border: `1.5px solid ${error ? "#DC2626" : "#E7E0E9"}`,
                  borderRadius: 12,
                  padding: "11px 14px 11px 38px",
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "inherit",
                  color: "#1D1B2E",
                  outline: "none",
                }}
                onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = "#7C5FAE"; }}
                onBlur={(e) => { if (!error) e.currentTarget.style.borderColor = "#E7E0E9"; }}
              />
            </div>

            {/* Error message */}
            {error && (
              <p style={{ fontSize: 12, fontWeight: 500, color: "#DC2626", margin: "0" }}>
                {error}
              </p>
            )}

            {/* Submit */}
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
                transition: "background 0.15s",
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
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        {/* Demo credentials — shown below the card, visually separated */}
        <div
          style={{
            marginTop: 20,
            background: "#ffffff",
            borderRadius: 14,
            padding: "18px 20px",
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#8A8394",
              margin: "0 0 12px",
            }}
          >
            Demo accounts
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                  setError(null);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #E7E0E9",
                  background: "#F6F1F1",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  transition: "border-color 0.12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#C9BBDF")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E7E0E9")}
                title={`Fill in ${account.email} / ${account.password}`}
              >
                {/* Role chip */}
                <span
                  className="flex items-center justify-center shrink-0 font-bold"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    background: "#EFE7F7",
                    color: "#7C5FAE",
                    fontSize: 12,
                    fontFamily: "inherit",
                  }}
                >
                  {account.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1D1B2E" }}>
                    {account.name}
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "#7C5FAE",
                      }}
                    >
                      {account.role}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "#8A8394", marginTop: 1 }}>
                    {account.email} · {account.password}
                  </div>
                </div>
                <span
                  className="ti ti-arrow-right shrink-0"
                  style={{ fontSize: 14, color: "#C9BBDF" }}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, fontWeight: 500, color: "#8A8394", marginTop: 12, marginBottom: 0 }}>
            Click any account to fill in the form, then press Sign in.
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
