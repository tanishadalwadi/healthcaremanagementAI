/**
 * Patient detail page — Phase 5, updated Phase 8C, Phase 11A
 *
 * Client component (converted 8C) so in-memory writes from visit mode are
 * visible in the same browser session.
 *
 * Phase 11A: also fetches nursing tasks for the Tasks tab.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import {
  getPatientById,
  getTasksForPatient,
  getConsultationsForPatient,
  type Consultation,
} from "@/lib/api";
import { PatientDetailView } from "@/components/patient/patient-detail-view";
import type { PatientDetail, NursingTask } from "@/types";

export default function PatientDetailPage() {
  const params = useParams() as { id: string };
  const [patient,      setPatient]      = useState<PatientDetail | null | undefined>(undefined);
  const [nursingTasks, setNursingTasks] = useState<NursingTask[]>([]);

  const [consultations, setConsultations] = useState<Consultation[]>([]);

  const reloadPatient = useCallback(() => {
    if (!params.id) return;
    return Promise.all([
      getPatientById(params.id),
      getTasksForPatient(params.id),
      getConsultationsForPatient(params.id),
    ]).then(([p, tasks, consults]) => {
      setPatient(p ?? null);
      setNursingTasks(tasks);
      setConsultations(consults);
    });
  }, [params.id]);

  useEffect(() => {
    reloadPatient();
  }, [reloadPatient]);

  if (patient === undefined) {
    return (
      <div
        style={{
          padding: "64px 0",
          textAlign: "center",
          fontSize: 13,
          fontWeight: 500,
          color: "#8A8394",
        }}
      >
        Loading patient…
      </div>
    );
  }

  if (patient === null) {
    notFound();
  }

  return (
    <PatientDetailView
      patient={patient}
      nursingTasks={nursingTasks}
      consultations={consultations}
      onDataChange={reloadPatient}
    />
  );
}
