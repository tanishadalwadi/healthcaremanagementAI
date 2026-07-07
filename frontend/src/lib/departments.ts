import { apiGet, type Paginated } from "@/lib/api-client";
import { mapDepartmentName } from "@/lib/mappers/patient";
import type { Department } from "@/types";

interface BackendDepartmentSummary {
  id: string;
  name: string;
}

/** Resolves a frontend department label to a backend department UUID. */
export async function resolveDepartmentId(
  department: Department,
): Promise<string> {
  const data = await apiGet<Paginated<BackendDepartmentSummary>>(
    "/departments?limit=100",
  );

  const match = data.items.find(
    (item) => mapDepartmentName(item.name) === department,
  );

  if (match) return match.id;

  const fallback = data.items[0];
  if (!fallback) {
    throw new Error("No departments found in the backend.");
  }

  return fallback.id;
}
