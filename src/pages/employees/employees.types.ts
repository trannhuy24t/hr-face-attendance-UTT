import type { BadgeTone } from "../../lib/badge";

export type BiometricStatus = "reviewed" | "pending" | "draft" | "locked";
export type AttendanceStatus = "present" | "late" | "absent";

export interface EmployeeRow {
  id: string;
  name: string;
  role: string;
  code: string;
  department: string;
  branch: string;
  biometricStatus: BiometricStatus;
  biometricMeta: string;
  status: AttendanceStatus;
}

export interface EmployeeListResponse {
  branches: string[];
  departments: string[];
  total: number;
  page: number;
  pageSize: number;
  employees: EmployeeRow[];
}

export const BIOMETRIC_LABEL: Record<BiometricStatus, { label: string; tone: BadgeTone }> = {
  reviewed: { label: "Đã đăng ký", tone: "success" },
  pending: { label: "Chờ duyệt", tone: "warning" },
  draft: { label: "Chưa đăng ký", tone: "neutral" },
  locked: { label: "Đã khoá", tone: "danger" },
};

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, { label: string; tone: BadgeTone }> = {
  present: { label: "Present", tone: "success" },
  late: { label: "Late", tone: "warning" },
  absent: { label: "Absent", tone: "danger" },
};
