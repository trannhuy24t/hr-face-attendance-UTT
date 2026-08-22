import { apiFetch } from "../../lib/httpClient";
import type {
  LoginPayload,
  LoginResponseData,
  RegisterPayload,
  RegisterResponseData,
} from "./auth.types";

export function registerTenant(payload: RegisterPayload, signal?: AbortSignal) {
  return apiFetch<RegisterResponseData>("/api/v1/auth/register", {
    method: "POST",
    body: payload,
    signal,
  });
}

export function login(payload: LoginPayload, signal?: AbortSignal) {
  return apiFetch<LoginResponseData>("/api/v1/auth/login", {
    method: "POST",
    body: payload,
    signal,
  });
}

export function refreshAccessToken(signal?: AbortSignal) {
  return apiFetch<{ access_token: string }>("/api/v1/auth/refresh", {
    method: "POST",
    signal,
  });
}

export function logout(signal?: AbortSignal) {
  return apiFetch<void>("/api/v1/auth/logout", {
    method: "POST",
    signal,
  });
}
