/**
 * Nurse dashboard — /nurse
 *
 * Client component: reads nurseId from auth context, fetches
 * assigned patients + tasks in parallel, passes to NurseDashboardClient.
 */

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getPatientsForNurse, getNursingTasks } from "@/lib/api";
import { NurseDashboardClient } from "@/components/nurse/nurse-dashboard-client";
import type { Patient, NursingTask } from "@/types";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function NurseDashboardPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tasks, setTasks]       = useState<NursingTask[]>([]);
  const [ready, setReady]       = useState(false);

  useEffect(() => {
    if (!user?.nurseId) return;
    Promise.all([
      getPatientsForNurse(user.nurseId),
      getNursingTasks(user.nurseId),
    ]).then(([pts, tks]) => {
      setPatients(pts);
      setTasks(tks);
      setReady(true);
    });
  }, [user]);

  if (!ready) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center", color: "#8A8394", fontSize: 13 }}>
        Loading your dashboard…
      </div>
    );
  }

  return (
    <NurseDashboardClient
      patients={patients}
      tasks={tasks}
      nurseId={user!.nurseId!}
      greeting={greeting()}
      nurseName={user!.name}
    />
  );
}
