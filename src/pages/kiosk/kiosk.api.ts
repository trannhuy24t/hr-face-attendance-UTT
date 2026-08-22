import { apiFetch } from "../../lib/httpClient";
import type { KioskListResponse } from "./kiosk.types";

export interface KioskListQuery {
  branch: string;
  zone: string;
  issueOnly: boolean;
}

export function fetchKiosks(query: KioskListQuery, signal?: AbortSignal) {
  const params = new URLSearchParams();
  if (query.branch !== "Tất cả") params.set("branch", query.branch);
  if (query.zone !== "Tất cả") params.set("zone", query.zone);
  if (query.issueOnly) params.set("issueOnly", "true");

  return apiFetch<KioskListResponse>(`/api/v1/kiosks?${params.toString()}`, { signal });
}
