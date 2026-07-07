import { z } from "zod";

export const patientIdParamSchema = z.object({
  patientId: z.string().uuid("Invalid patient id"),
});

export const dischargeConditionIdParamSchema = z.object({
  id: z.string().uuid("Invalid discharge condition id"),
});

export const updateDischargeConditionBodySchema = z.object({
  status: z.enum(["COMPLETE", "INCOMPLETE"]),
});

export type UpdateDischargeConditionBody = z.infer<
  typeof updateDischargeConditionBodySchema
>;
