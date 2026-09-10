import type { BadgeTone } from "../../lib/badge";

export type ShiftStatus =
  | "draft"
  | "published"
  | "confirmed"
  | "change_requested"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface ShiftEmployeeRef {
  id: string;
  fullName: string;
  employeeCode: string;
}

export interface ShiftBranchRef {
  id: string;
  name: string;
}

export interface Shift {
  id: string;
  branchId: string;
  employeeId: string;
  shiftTemplateId: string | null;
  homeBranchId: string;
  startTime: string;
  endTime: string;
  status: ShiftStatus;
  isCrossBranch: boolean;
  branch: ShiftBranchRef;
  homeBranch: ShiftBranchRef;
  employee: ShiftEmployeeRef;
  createdAt: string;
  updatedAt: string;
}

export const SHIFT_STATUS_LABEL: Record<ShiftStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Nháp", tone: "neutral" },
  published: { label: "Đã công bố", tone: "info" },
  confirmed: { label: "Đã xác nhận", tone: "success" },
  change_requested: { label: "Yêu cầu đổi ca", tone: "warning" },
  in_progress: { label: "Đang diễn ra", tone: "info" },
  completed: { label: "Hoàn thành", tone: "success" },
  cancelled: { label: "Đã huỷ", tone: "danger" },
};

// Mirrors VALID_STATUS_TRANSITIONS in the backend's shifts.service.ts.
export const SHIFT_STATUS_TRANSITIONS: Record<ShiftStatus, ShiftStatus[]> = {
  draft: ["published", "cancelled"],
  published: ["confirmed", "change_requested", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  change_requested: ["published", "cancelled"],
  in_progress: ["completed"],
  completed: [],
  cancelled: [],
};

export const REASON_REQUIRED_STATUSES: ShiftStatus[] = ["change_requested", "cancelled"];
