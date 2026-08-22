import type { BadgeTone } from "../../lib/badge";

export type KioskStatus = "online" | "offline" | "warning" | "locked";

export interface KioskHeartbeatBar {
  heightPercent: number;
  ok: boolean;
}

export interface KioskEvent {
  text: string;
  time: string;
  tag: string;
  tone: BadgeTone;
}

export interface KioskDevice {
  id: string;
  tag: string;
  name: string;
  zone: string;
  branch: string;
  ip: string;
  version: string;
  heartbeatLabel: string;
  heartbeatMeta: string;
  status: KioskStatus;
  scansToday: string;
  uptimeLabel: string;
  note: string;
  bars: KioskHeartbeatBar[];
  events: KioskEvent[];
}

export interface KioskSummaryCard {
  title: string;
  value: string;
  unit: string;
  badge: string;
  tone: BadgeTone;
}

export interface KioskListResponse {
  headerMeta: string;
  branches: string[];
  zones: string[];
  summary: KioskSummaryCard[];
  devices: KioskDevice[];
}

export const KIOSK_STATUS_LABEL: Record<KioskStatus, { label: string; tone: BadgeTone }> = {
  online: { label: "Online", tone: "success" },
  offline: { label: "Offline", tone: "danger" },
  warning: { label: "Chậm phản hồi", tone: "warning" },
  locked: { label: "Tạm khoá", tone: "neutral" },
};
