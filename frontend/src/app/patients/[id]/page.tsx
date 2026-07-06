/**
 * Patient detail page — Phase 5, updated Phase 8C, Phase 11A
 *
 * Client component (converted 8C) so in-memory writes from visit mode are
 * visible in the same browser session.
 *
 * Phase 11A: also fetches nursing tasks for the Tasks tab.
 */

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { getPatientById, getTasksForPatient } from "@/lib/api";
import { PatientDetailView } from "@/components/patient/patient-detail-view";
import type { PatientDetail, NursingTask } from "@/types";

export default function PatientDetailPage() {
  const params = useParams() as { id: string };
  const [patient,      setPatient]      = useState<PatientDetail | null | undefined>(undefined);
  const [nursingTasks, setNursingTasks] = useState<NursingTask[]>([]);

  useEffect(() => {
    if (!params.id) return;
    Promise.all([
      getPatientById(params.id),
      getTasksForPatient(params.id),
    ]).then(([p, tasks]) => {
      setPatient(p ?? null);
      setNursingTasks(tasks);
    });
  }, [params.id]);

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

  return <PatientDetailView patient={patient} nursingTasks={nursingTasks} />;
}
