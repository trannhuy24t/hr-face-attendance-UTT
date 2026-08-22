import { apiFetch } from "../../lib/httpClient";
import type { ScheduleResponse } from "./schedule.types";

export interface ScheduleQuery {
  weekOffset: number;
  branch: string;
  department: string;
  gapOnly: boolean;
}

export function fetchSchedule(query: ScheduleQuery, signal?: AbortSignal) {
  const params = new URLSearchParams();
  params.set("weekOffset", String(query.weekOffset));
  if (query.branch !== "Tất cả") params.set("branch", query.branch);
  if (query.department !== "Tất cả") params.set("department", query.department);
  if (query.gapOnly) params.set("gapOnly", "true");

  return apiFetch<ScheduleResponse>(`/api/v1/schedules?${params.toString()}`, { signal });
}
