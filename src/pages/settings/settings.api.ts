import { apiFetch } from "../../lib/httpClient";
import type { BiometricStatusResponse, SettingsResponse } from "./settings.types";

export function fetchSettings(signal?: AbortSignal) {
  return apiFetch<SettingsResponse>("/api/v1/settings", { signal });
}

export interface BiometricStatusQuery {
  branch: string;
  department: string;
  pendingOnly: boolean;
}

export function fetchBiometricStatus(query: BiometricStatusQuery, signal?: AbortSignal) {
  const params = new URLSearchParams();
  if (query.branch !== "Tất cả") params.set("branch", query.branch);
  if (query.department !== "Tất cả") params.set("department", query.department);
  if (query.pendingOnly) params.set("pendingOnly", "true");

  return apiFetch<BiometricStatusResponse>(
    `/api/v1/employees/biometric-status?${params.toString()}`,
    { signal },
  );
}
