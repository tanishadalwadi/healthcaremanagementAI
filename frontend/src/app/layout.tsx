import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Pulse — Hospital Workflow Coordination",
  description: "AI-powered care coordination for hospital teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/*
        bg-bg = #F6F1F1 (Pulse page background token)
        antialiased = -webkit-font-smoothing: antialiased
        font-sans = Hanken Grotesk (configured in tailwind.config.ts)
      */}
      {/*
        bg-bg = #F6F1F1 (Pulse page background token)
        TopChrome is NOT here — each authenticated sub-layout adds it.
        Login page intentionally receives no chrome.
      */}
      <body className="bg-bg font-sans antialiased" style={{ color: "#1D1B2E" }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
