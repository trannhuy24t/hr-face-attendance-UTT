import { apiFetch, apiFetchPage } from "../../lib/httpClient";
import type { Shift, ShiftStatus } from "./schedule.types";

export interface ShiftListQuery {
  branchId?: string;
  employeeId?: string;
  status?: ShiftStatus;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

export function fetchShifts(query: ShiftListQuery, signal?: AbortSignal) {
  const params = new URLSearchParams();
  if (query.branchId) params.set("branchId", query.branchId);
  if (query.employeeId) params.set("employeeId", query.employeeId);
  if (query.status) params.set("status", query.status);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));

  return apiFetchPage<Shift>(`/api/v1/shifts?${params.toString()}`, { signal });
}

export interface CreateShiftPayload {
  branchId: string;
  employeeId: string;
  shiftTemplateId?: string;
  startTime: string;
  endTime: string;
}

export function createShift(payload: CreateShiftPayload, signal?: AbortSignal) {
  return apiFetch<Shift>("/api/v1/shifts", { method: "POST", body: payload, signal });
}

export interface BatchCreateShiftPayload {
  branchId: string;
  shiftTemplateId: string;
  employeeIds: string[];
  startDate: string;
  endDate: string;
  excludeDates?: string[];
  excludeWeeklyOff?: boolean;
}

export function batchCreateShifts(payload: BatchCreateShiftPayload, signal?: AbortSignal) {
  return apiFetch<{ created: number } | Shift[]>("/api/v1/shifts/batch", {
    method: "POST",
    body: payload,
    signal,
  });
}

export function updateShiftStatus(
  shiftId: string,
  status: ShiftStatus,
  reason?: string,
  signal?: AbortSignal,
) {
  return apiFetch<Shift>(`/api/v1/shifts/${shiftId}/status`, {
    method: "PATCH",
    body: { status, reason },
    signal,
  });
}

export function deleteShift(shiftId: string, signal?: AbortSignal) {
  return apiFetch<{ id: string; deleted: boolean }>(`/api/v1/shifts/${shiftId}`, {
    method: "DELETE",
    signal,
  });
}
