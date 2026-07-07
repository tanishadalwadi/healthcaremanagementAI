/**
 * Patient list — /patients
 *
 * Role-scoped list of active patients. Linked from the nurse dashboard
 * "View all" action. Nurse/doctor see their assigned patients; admin sees all.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  getPatients,
  getPatientsForDoctor,
  getPatientsForNurse,
} from "@/lib/api";
import { PatientCardCompact } from "@/components/patient/patient-card";
import type { Patient } from "@/types";

export default function PatientsListPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchPatients = async () => {
      try {
        setError(null);
        if (user.role === "nurse" && user.nurseId) {
          return getPatientsForNurse(user.nurseId);
        }
        if (user.role === "doctor" && user.doctorId) {
          return getPatientsForDoctor(user.doctorId);
        }
        return getPatients();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load patients";
        setError(message);
        return [];
      }
    };

    fetchPatients().then((data) => {
      setPatients(data);
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          padding: "48px 28px",
          textAlign: "center",
          color: "#8A8394",
          fontSize: 13,
        }}
      >
        Loading patients…
      </div>
    );
  }

  const scopeLabel =
    user?.role === "admin"
      ? "All active patients"
      : user?.role === "doctor"
        ? "Your patients"
        : "Your assigned patients";

  return (
    <div style={{ maxWidth: 1360, margin: "0 auto", padding: "28px" }}>
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            margin: 0,
          }}
        >
          Patients
        </h1>
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#8A8394",
            marginTop: 4,
            marginBottom: 0,
          }}
        >
          {patients.length} patient{patients.length !== 1 ? "s" : ""} · {scopeLabel}
        </p>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 14px",
            borderRadius: 12,
            background: "#F8DFDB",
            color: "#DC2626",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {patients.length === 0 ? (
        <div
          style={{
            padding: "48px 0",
            textAlign: "center",
            color: "#8A8394",
            fontSize: 13,
          }}
        >
          No patients found.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
          }}
        >
          {patients.map((patient) => (
            <Link
              key={patient.id}
              href={`/patients/${patient.id}`}
              style={{ display: "block", textDecoration: "none", color: "inherit" }}
            >
              <PatientCardCompact patient={patient} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
