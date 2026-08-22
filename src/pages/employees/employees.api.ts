import { apiFetch } from "../../lib/httpClient";
import type { EmployeeListResponse } from "./employees.types";

export interface EmployeeListQuery {
  branch: string;
  department: string;
  biometricPending: boolean;
  page: number;
  pageSize: number;
}

export function fetchEmployees(query: EmployeeListQuery, signal?: AbortSignal) {
  const params = new URLSearchParams();
  if (query.branch !== "Tất cả") params.set("branch", query.branch);
  if (query.department !== "Tất cả") params.set("department", query.department);
  if (query.biometricPending) params.set("biometricPending", "true");
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));

  return apiFetch<EmployeeListResponse>(`/api/v1/employees?${params.toString()}`, { signal });
}
