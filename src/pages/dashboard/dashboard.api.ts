import { apiFetch } from "../../lib/httpClient";
import type { DashboardOverview } from "./dashboard.types";

export function fetchDashboardOverview(signal?: AbortSignal) {
  return apiFetch<DashboardOverview>("/api/v1/dashboard/overview", { signal });
}
