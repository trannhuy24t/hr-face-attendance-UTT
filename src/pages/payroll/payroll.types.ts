import type { BadgeTone } from "../../lib/badge";
import type { BiometricStatus } from "../employees/employees.types";

export type PayrollStatus = "draft" | "pending_review" | "reviewed" | "locked" | "claim";

export interface PayrollRow {
  id: string;
  name: string;
  code: string;
  department: string;
  branch: string;
  workdays: string;
  base: number;
  adjustment: number;
  biometricStatus: BiometricStatus;
  status: PayrollStatus;
}

export interface PayrollSummaryCard {
  title: string;
  value: string;
  unit: string;
  badge: string;
  tone: BadgeTone;
}

export interface PayrollResponse {
  periodLabel: string;
  deadlineLabel: string;
  branches: string[];
  departments: string[];
  summary: PayrollSummaryCard[];
  rows: PayrollRow[];
  totalDisplayed: number;
}

export const PAYROLL_STATUS_LABEL: Record<PayrollStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Draft", tone: "neutral" },
  pending_review: { label: "Pending review", tone: "warning" },
  reviewed: { label: "Reviewed", tone: "info" },
  locked: { label: "Locked", tone: "neutral" },
  claim: { label: "Khiếu nại", tone: "danger" },
};

export const BIOMETRIC_LABEL: Record<BiometricStatus, { label: string; tone: BadgeTone }> = {
  reviewed: { label: "Đã đăng ký", tone: "success" },
  pending: { label: "Chờ duyệt", tone: "warning" },
  draft: { label: "Chưa đăng ký", tone: "neutral" },
  locked: { label: "Đã khoá", tone: "danger" },
};
