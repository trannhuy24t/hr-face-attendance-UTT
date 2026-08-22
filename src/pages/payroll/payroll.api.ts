import { apiFetch } from "../../lib/httpClient";
import type { PayrollResponse } from "./payroll.types";

export interface PayrollQuery {
  branch: string;
  department: string;
  claimOnly: boolean;
}

export function fetchPayroll(query: PayrollQuery, signal?: AbortSignal) {
  const params = new URLSearchParams();
  if (query.branch !== "Tất cả") params.set("branch", query.branch);
  if (query.department !== "Tất cả") params.set("department", query.department);
  if (query.claimOnly) params.set("claimOnly", "true");

  return apiFetch<PayrollResponse>(`/api/v1/payroll?${params.toString()}`, { signal });
}
