import type { BadgeTone } from "../../lib/badge";

export type LeaveStatus = "pending_review" | "reviewed" | "locked" | "draft" | "rejected";

export interface LeaveImpact {
  day: string;
  shift: string;
  status: string;
  tone: BadgeTone;
}

export interface LeaveRequest {
  id: string;
  name: string;
  department: string;
  branch: string;
  type: string;
  range: string;
  days: string;
  submittedAt: string;
  status: LeaveStatus;
  reason: string;
  overdue: boolean;
  remainingLeaveDays: string;
  impact: LeaveImpact[];
}

export interface LeaveListResponse {
  branches: string[];
  departments: string[];
  pendingCount: number;
  overdueCount: number;
  requests: LeaveRequest[];
}

export const LEAVE_STATUS_LABEL: Record<LeaveStatus, { label: string; tone: BadgeTone }> = {
  pending_review: { label: "Pending review", tone: "warning" },
  reviewed: { label: "Reviewed", tone: "info" },
  locked: { label: "Locked", tone: "neutral" },
  draft: { label: "Draft", tone: "neutral" },
  rejected: { label: "Từ chối", tone: "danger" },
};
