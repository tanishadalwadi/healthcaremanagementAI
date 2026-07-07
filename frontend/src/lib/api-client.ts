/**
 * Token storage + authenticated API client for Pulse backend.
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const TOKEN_KEY = "pulse_token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  error?: unknown;
}

export interface Paginated<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function parseJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("Invalid JSON response from API", response.status);
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const body = await parseJson<ApiSuccess<T> | ApiFailure>(response);

  if (!response.ok || !body.success) {
    const message =
      "message" in body && body.message
        ? body.message
        : `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return body.data;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });
  return handleResponse<T>(response);
}

export async function apiPost<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  return handleResponse<T>(response);
}

export async function apiPatch<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  return handleResponse<T>(response);
}

// ─── Department name cache ─────────────────────────────────────────────────────

let departmentMapPromise: Promise<Map<string, string>> | null = null;

interface BackendDepartmentSummary {
  id: string;
  name: string;
}

export async function getDepartmentNameMap(): Promise<Map<string, string>> {
  if (!departmentMapPromise) {
    departmentMapPromise = apiGet<Paginated<BackendDepartmentSummary>>(
      "/departments?limit=100",
    ).then((data) => new Map(data.items.map((d) => [d.id, d.name])));
  }
  return departmentMapPromise;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Pass-through when already a backend UUID. */
export async function resolveStaffId(
  id: string,
  _role: "NURSE" | "DOCTOR",
): Promise<string> {
  if (UUID_RE.test(id)) return id;
  return id;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "nurse" | "doctor";
  };
}

export async function apiLogin(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const data = await apiPost<LoginResponse>("/auth/login", { email, password });
  setAuthToken(data.token);
  return data;
}

export async function apiMe(): Promise<LoginResponse["user"]> {
  return apiGet<LoginResponse["user"]>("/auth/me");
}
