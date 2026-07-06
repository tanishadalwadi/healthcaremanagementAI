/**
 * Doctor morning rounds page — /doctor
 *
 * Client component: reads doctorId from auth context, fetches
 * scoped admitted + discharged patients in parallel.
 */

"use client";

import { useEffect, useState } from "react";
import { useAuth, DEMO_ACCOUNTS } from "@/lib/auth";
import { getPatientsForDoctor, getDischargedPatientsForDoctor } from "@/lib/api";
import { MorningRoundsClient } from "@/components/doctor/morning-rounds-client";
import type { Patient } from "@/types";

export default function DoctorPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [history,  setHistory]  = useState<Patient[]>([]);
  const [ready,    setReady]    = useState(false);

  useEffect(() => {
    if (!user?.doctorId) return;
    Promise.all([
      getPatientsForDoctor(user.doctorId),
      getDischargedPatientsForDoctor(user.doctorId),
    ]).then(([pts, hist]) => {
      setPatients(pts);
      setHistory(hist);
      setReady(true);
    });
  }, [user]);

  if (!ready) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center", color: "#8A8394", fontSize: 13 }}>
        Loading your rounds…
      </div>
    );
  }

  // Derive doctor display name and specialty from the demo account record
  const account = DEMO_ACCOUNTS.find((a) => a.id === user!.id);
  const doctorName    = account?.name    ?? user!.name;
  const doctorSubtitle = account?.subtitle ?? "Attending";

  return (
    <MorningRoundsClient
      patients={patients}
      history={history}
      doctorName={doctorName}
      doctorSubtitle={doctorSubtitle}
    />
  );
}
