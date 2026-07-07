import { z } from "zod";

export const ambulanceIdParamSchema = z.object({
  id: z.string().uuid("Invalid ambulance id"),
});

export const listAmbulancesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum(["AVAILABLE", "DISPATCHED"]).optional(),
});

export const updateAmbulanceStatusBodySchema = z.object({
  status: z.enum(["AVAILABLE", "DISPATCHED"]),
});

export type ListAmbulancesQuery = z.infer<typeof listAmbulancesQuerySchema>;
export type UpdateAmbulanceStatusBody = z.infer<
  typeof updateAmbulanceStatusBodySchema
>;
