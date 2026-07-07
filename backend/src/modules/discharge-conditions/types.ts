import type { DischargeConditionStatus } from "@prisma/client";

export interface DischargeConditionDto {
  id: string;
  patientId: string;
  condition: string;
  status: DischargeConditionStatus;
  owningDepartment: string;
  updatedAt: Date;
}

export interface UpdateDischargeConditionInput {
  status: DischargeConditionStatus;
}
