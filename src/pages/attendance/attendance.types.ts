import type { BadgeTone } from "../../lib/badge";
import type { BiometricStatus } from "../employees/employees.types";

export type AttendanceRowStatus = "present" | "late" | "absent";

export interface AttendanceRecord {
  id: string;
  name: string;
  code: string;
  department: string;
  branch: string;
  shift: string;
  checkIn: string;
  checkOut: string;
  source: string;
  biometricStatus: BiometricStatus;
  status: AttendanceRowStatus;
}

export interface AttendanceSummaryCard {
  title: string;
  value: string;
  unit: string;
  badge: string;
  tone: BadgeTone;
}

export interface AttendanceResponse {
  dateLabel: string;
  branches: string[];
  departments: string[];
  summary: AttendanceSummaryCard[];
  records: AttendanceRecord[];
  updatedAt: string;
}

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceRowStatus, { label: string; tone: BadgeTone }> = {
  present: { label: "Present", tone: "success" },
  late: { label: "Late", tone: "warning" },
  absent: { label: "Absent", tone: "danger" },
};

export const BIOMETRIC_LABEL: Record<BiometricStatus, { label: string; tone: BadgeTone }> = {
  reviewed: { label: "Đã đăng ký", tone: "success" },
  pending: { label: "Chờ duyệt", tone: "warning" },
  draft: { label: "Chưa đăng ký", tone: "neutral" },
  locked: { label: "Đã khoá", tone: "danger" },
};
