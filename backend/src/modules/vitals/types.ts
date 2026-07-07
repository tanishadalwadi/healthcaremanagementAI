export interface VitalSignListQuery {
  page: number;
  limit: number;
}

export interface CreateVitalSignInput {
  bloodPressure: string;
  pulse: number;
  temperature: number;
  respRate: number;
  o2Saturation: number;
  recordedById?: string | null;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VitalSignDto {
  id: string;
  patientId: string;
  recordedById: string | null;
  bloodPressure: string;
  pulse: number;
  temperature: number;
  respRate: number;
  o2Saturation: number;
  recordedAt: Date;
}
