import { apiFetch } from "../../lib/httpClient";
import type { Branch, BranchDetail, Department, Holiday } from "./organization.types";

// ---- Branches ----

export function fetchBranches(signal?: AbortSignal) {
  return apiFetch<Branch[]>("/api/v1/organization/branches", { signal });
}

export function fetchBranch(branchId: string, signal?: AbortSignal) {
  return apiFetch<BranchDetail>(`/api/v1/organization/branches/${branchId}`, { signal });
}

export interface BranchPayload {
  name: string;
  timezone?: string;
  currency?: string;
  weeklyOffDays?: number[];
}

export function createBranch(payload: BranchPayload, signal?: AbortSignal) {
  return apiFetch<Branch>("/api/v1/organization/branches", {
    method: "POST",
    body: payload,
    signal,
  });
}

export function updateBranch(branchId: string, payload: Partial<BranchPayload>, signal?: AbortSignal) {
  return apiFetch<Branch>(`/api/v1/organization/branches/${branchId}`, {
    method: "PATCH",
    body: payload,
    signal,
  });
}

export function deleteBranch(branchId: string, signal?: AbortSignal) {
  return apiFetch<{ message: string }>(`/api/v1/organization/branches/${branchId}`, {
    method: "DELETE",
    signal,
  });
}

// ---- Departments ----

export function fetchDepartments(branchId: string, signal?: AbortSignal) {
  return apiFetch<Department[]>(`/api/v1/organization/branches/${branchId}/departments`, { signal });
}

export interface DepartmentPayload {
  name: string;
  code: string;
}

export function createDepartment(branchId: string, payload: DepartmentPayload, signal?: AbortSignal) {
  return apiFetch<Department>(`/api/v1/organization/branches/${branchId}/departments`, {
    method: "POST",
    body: payload,
    signal,
  });
}

export function updateDepartment(
  branchId: string,
  departmentId: string,
  payload: Partial<DepartmentPayload>,
  signal?: AbortSignal,
) {
  return apiFetch<Department>(`/api/v1/organization/branches/${branchId}/departments/${departmentId}`, {
    method: "PATCH",
    body: payload,
    signal,
  });
}

export function deleteDepartment(branchId: string, departmentId: string, signal?: AbortSignal) {
  return apiFetch<{ message: string }>(
    `/api/v1/organization/branches/${branchId}/departments/${departmentId}`,
    { method: "DELETE", signal },
  );
}

// ---- Holidays ----

export function fetchHolidays(branchId?: string, signal?: AbortSignal) {
  const query = branchId ? `?branchId=${branchId}` : "";
  return apiFetch<Holiday[]>(`/api/v1/organization/holidays${query}`, { signal });
}

export interface HolidayPayload {
  name: string;
  startDate: string;
  endDate: string;
  branchId?: string;
  isPaid?: boolean;
  multiplierRate?: number;
}

export function createHoliday(payload: HolidayPayload, signal?: AbortSignal) {
  return apiFetch<Holiday>("/api/v1/organization/holidays", {
    method: "POST",
    body: payload,
    signal,
  });
}

export function updateHoliday(holidayId: string, payload: Partial<HolidayPayload>, signal?: AbortSignal) {
  return apiFetch<Holiday>(`/api/v1/organization/holidays/${holidayId}`, {
    method: "PATCH",
    body: payload,
    signal,
  });
}

export function deleteHoliday(holidayId: string, signal?: AbortSignal) {
  return apiFetch<{ message: string }>(`/api/v1/organization/holidays/${holidayId}`, {
    method: "DELETE",
    signal,
  });
}
