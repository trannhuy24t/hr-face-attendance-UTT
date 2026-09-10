import { apiFetch } from "../../lib/httpClient";
import type { CreatedUser, UserRoleAssignment } from "./users.types";

export interface CreateUserPayload {
  email: string;
  password: string;
  fullName: string;
  employeeId?: string;
}

export function createUser(payload: CreateUserPayload, signal?: AbortSignal) {
  return apiFetch<CreatedUser>("/api/v1/users", { method: "POST", body: payload, signal });
}

export function softDeleteUser(userId: string, signal?: AbortSignal) {
  return apiFetch<{ message: string }>(`/api/v1/users/${userId}`, { method: "DELETE", signal });
}

export function fetchUserRoles(userId: string, signal?: AbortSignal) {
  return apiFetch<UserRoleAssignment[]>(`/api/v1/users/${userId}/roles`, { signal });
}

export interface RoleAssignmentInput {
  branchId: string | null;
  role: "owner" | "manager" | "accountant" | "staff";
}

export function updateUserRoles(userId: string, roles: RoleAssignmentInput[], signal?: AbortSignal) {
  return apiFetch<UserRoleAssignment[]>(`/api/v1/users/${userId}/roles`, {
    method: "PUT",
    body: { roles },
    signal,
  });
}
