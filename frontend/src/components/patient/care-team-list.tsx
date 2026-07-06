/**
 * CareTeamList — multiple rows, never a single "assigned doctor" field.
 *
 * Each row: Avatar + Name + Role label ("Attending · Cardiology", "Nurse · Day shift")
 * Eyebrow caption header above the list.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import type { CareTeamAssignment } from "@/types";

export interface CareTeamListProps {
  assignments: CareTeamAssignment[];
  className?: string;
}

export const CareTeamList: React.FC<CareTeamListProps> = ({
  assignments,
  className,
}) => (
  <div className={cn("space-y-0.5", className)}>
    <p className="text-caption text-text-muted mb-3">Care team</p>

    {assignments.map((assignment, i) => {
      if (assignment.doctor) {
        const { name, initials, specialty, role } = assignment.doctor;
        return (
          <div key={`doctor-${i}`} className="flex items-center gap-2.5 py-1.5">
            <Avatar initials={initials} size="sm" />
            <div className="min-w-0">
              <p
                className="font-[500] text-text-primary truncate"
                style={{ fontSize: 12 }}
              >
                {name}
              </p>
              <p className="text-micro text-text-muted truncate">
                {role} · {specialty}
              </p>
            </div>
          </div>
        );
      }

      if (assignment.nurse) {
        const { name, initials, shift } = assignment.nurse;
        return (
          <div key={`nurse-${i}`} className="flex items-center gap-2.5 py-1.5">
            <Avatar initials={initials} size="sm" />
            <div className="min-w-0">
              <p
                className="font-[500] text-text-primary truncate"
                style={{ fontSize: 12 }}
              >
                {name}
              </p>
              <p className="text-micro text-text-muted truncate">
                Nurse · {shift} shift
              </p>
            </div>
          </div>
        );
      }

      return null;
    })}
  </div>
);

CareTeamList.displayName = "CareTeamList";
