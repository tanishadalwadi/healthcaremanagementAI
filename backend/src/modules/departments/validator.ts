import { DepartmentStatus } from "@prisma/client";
import { z } from "zod";

export const departmentIdParamSchema = z.object({
  id: z.string().uuid("Invalid department id"),
});

export const listDepartmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).optional(),
  status: z.nativeEnum(DepartmentStatus).optional(),
});

export const createDepartmentBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Department name is required")
    .max(100, "Department name must be at most 100 characters"),
  status: z.nativeEnum(DepartmentStatus).optional(),
});

export const updateDepartmentBodySchema = createDepartmentBodySchema.partial();

export type ListDepartmentsQuery = z.infer<typeof listDepartmentsQuerySchema>;
export type CreateDepartmentBody = z.infer<typeof createDepartmentBodySchema>;
export type UpdateDepartmentBody = z.infer<typeof updateDepartmentBodySchema>;
