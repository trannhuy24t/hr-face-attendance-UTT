import { apiFetch } from "../../lib/httpClient";
import type { LeaveListResponse } from "./leave.types";

export interface LeaveListQuery {
  branch: string;
  department: string;
  status: string;
}

export function fetchLeaveRequests(query: LeaveListQuery, signal?: AbortSignal) {
  const params = new URLSearchParams();
  if (query.branch !== "Tất cả") params.set("branch", query.branch);
  if (query.department !== "Tất cả") params.set("department", query.department);
  if (query.status !== "Tất cả") params.set("status", query.status);

  return apiFetch<LeaveListResponse>(`/api/v1/leave-requests?${params.toString()}`, { signal });
}
