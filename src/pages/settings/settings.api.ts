import { apiFetch } from "../../lib/httpClient";
import type { TenantSettings } from "./settings.types";

export function fetchTenantSettings(signal?: AbortSignal) {
  return apiFetch<TenantSettings>("/api/v1/organization/settings", { signal });
}

export interface UpdateTenantSettingsPayload {
  faceMatchThreshold?: number;
  maxFaceRetries?: number;
}

export function updateTenantSettings(
  payload: UpdateTenantSettingsPayload,
  signal?: AbortSignal,
) {
  return apiFetch<TenantSettings>("/api/v1/organization/settings", {
    method: "PATCH",
    body: payload,
    signal,
  });
}
