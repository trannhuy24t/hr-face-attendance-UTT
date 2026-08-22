import { apiFetch } from "../../lib/httpClient";
import type { AttendanceResponse } from "./attendance.types";

export interface AttendanceQuery {
  branch: string;
  department: string;
  issueOnly: boolean;
}

export function fetchAttendance(query: AttendanceQuery, signal?: AbortSignal) {
  const params = new URLSearchParams();
  if (query.branch !== "Tất cả") params.set("branch", query.branch);
  if (query.department !== "Tất cả") params.set("department", query.department);
  if (query.issueOnly) params.set("issueOnly", "true");

  return apiFetch<AttendanceResponse>(`/api/v1/attendance?${params.toString()}`, { signal });
}
