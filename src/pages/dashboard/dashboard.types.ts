export type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral";

export interface AttendanceTodaySummary {
  present: number;
  total: number;
  percent: number;
  deltaLabel: string;
}

export interface LateArrivalsSummary {
  count: number;
  needsReview: boolean;
  noExplanationCount: number;
}

export interface PendingLeaveSummary {
  count: number;
  overdueCount: number;
  overdueHours: number;
}

export interface KioskOfflineSummary {
  offlineCount: number;
  totalDevices: number;
  note: string;
}

export interface ActivityItem {
  id: string;
  initials: string;
  title: string;
  detail: string;
  status: { label: string; tone: BadgeTone };
  timeAgo: string;
}

export interface KioskStatusItem {
  id: string;
  name: string;
  detail: string;
  status: "online" | "offline";
}

export interface ApprovalQueueItem {
  id: string;
  label: string;
  count: number;
}

export interface DashboardOverview {
  updatedAt: string;
  attendanceToday: AttendanceTodaySummary;
  lateArrivals: LateArrivalsSummary;
  pendingLeave: PendingLeaveSummary;
  kioskOffline: KioskOfflineSummary;
  recentActivity: ActivityItem[];
  kioskStatus: KioskStatusItem[];
  approvalQueue: ApprovalQueueItem[];
}
