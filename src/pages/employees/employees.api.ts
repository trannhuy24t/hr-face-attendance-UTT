import { apiFetch, apiFetchPage } from "../../lib/httpClient";
import type { CompensationRecord, ContractType, Employee, EmployeeStatus, PayBasis } from "./employees.types";

export interface EmployeeListQuery {
  branchId?: string;
  departmentId?: string;
  status?: EmployeeStatus;
  search?: string;
  page: number;
  pageSize: number;
}

export function fetchEmployees(query: EmployeeListQuery, signal?: AbortSignal) {
  const params = new URLSearchParams();
  if (query.branchId) params.set("branchId", query.branchId);
  if (query.departmentId) params.set("departmentId", query.departmentId);
  if (query.status) params.set("status", query.status);
  if (query.search) params.set("search", query.search);
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));

  return apiFetchPage<Employee>(`/api/v1/employees?${params.toString()}`, { signal });
}

export function fetchEmployee(employeeId: string, signal?: AbortSignal) {
  return apiFetch<Employee>(`/api/v1/employees/${employeeId}`, { signal });
}

export interface CreateEmployeePayload {
  employeeCode: string;
  fullName: string;
  branchId: string;
  departmentId?: string;
  status?: "active" | "probation";
}

export function createEmployee(payload: CreateEmployeePayload, signal?: AbortSignal) {
  return apiFetch<Employee>("/api/v1/employees", { method: "POST", body: payload, signal });
}

export interface UpdateEmployeePayload {
  fullName?: string;
  departmentId?: string | null;
  status?: EmployeeStatus;
  terminationDate?: string;
}

export function updateEmployee(employeeId: string, payload: UpdateEmployeePayload, signal?: AbortSignal) {
  return apiFetch<Employee>(`/api/v1/employees/${employeeId}`, { method: "PUT", body: payload, signal });
}

export function softDeleteEmployee(employeeId: string, signal?: AbortSignal) {
  return apiFetch<{ message: string; deletedAt: string }>(`/api/v1/employees/${employeeId}`, {
    method: "DELETE",
    signal,
  });
}

export interface TransferEmployeePayload {
  targetBranchId: string;
  targetDepartmentId?: string;
}

export function transferEmployee(employeeId: string, payload: TransferEmployeePayload, signal?: AbortSignal) {
  return apiFetch<{ id: string; branchId: string; departmentId: string | null; message: string }>(
    `/api/v1/employees/${employeeId}/transfer`,
    { method: "PATCH", body: payload, signal },
  );
}

// ---- Compensation history ----

export function fetchCompensationHistory(employeeId: string, signal?: AbortSignal) {
  return apiFetch<CompensationRecord[]>(`/api/v1/employees/${employeeId}/compensation-history`, { signal });
}

export interface CreateCompensationPayload {
  contractType: ContractType;
  payBasis: PayBasis;
  rate: number;
  effectiveFrom: string;
}

export function createCompensation(employeeId: string, payload: CreateCompensationPayload, signal?: AbortSignal) {
  return apiFetch<CompensationRecord>(`/api/v1/employees/${employeeId}/compensation-history`, {
    method: "POST",
    body: payload,
    signal,
  });
}
