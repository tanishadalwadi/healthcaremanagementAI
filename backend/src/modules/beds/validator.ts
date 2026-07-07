import { z } from "zod";

export const bedIdParamSchema = z.object({
  id: z.string().uuid("Invalid bed id"),
});

export const listBedsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  departmentId: z.string().uuid("Invalid department id").optional(),
  status: z.enum(["AVAILABLE", "OCCUPIED"]).optional(),
});

export const assignBedBodySchema = z.object({
  patientId: z.string().uuid("Invalid patient id"),
});

export type ListBedsQuery = z.infer<typeof listBedsQuerySchema>;
export type AssignBedBody = z.infer<typeof assignBedBodySchema>;
