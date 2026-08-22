import type { BadgeTone } from "../../lib/badge";
import type { BiometricStatus } from "../employees/employees.types";

export interface SettingItem {
  key: string;
  label: string;
  hint: string;
  isToggle: boolean;
  value?: string;
  on?: boolean;
}

export interface SettingsTab {
  key: string;
  label: string;
  description: string;
  settings: SettingItem[];
}

export interface SettingsResponse {
  companyMeta: string;
  tabs: SettingsTab[];
}

export interface BiometricEmployeeRow {
  id: string;
  name: string;
  code: string;
  department: string;
  branch: string;
  biometricStatus: BiometricStatus;
  biometricMeta: string;
}

export interface BiometricStatusResponse {
  branches: string[];
  departments: string[];
  doneCount: number;
  totalCount: number;
  metaLabel: string;
  rows: BiometricEmployeeRow[];
}

export const BIOMETRIC_LABEL: Record<BiometricStatus, { label: string; tone: BadgeTone }> = {
  reviewed: { label: "Đã đăng ký", tone: "success" },
  pending: { label: "Chờ duyệt", tone: "warning" },
  draft: { label: "Chưa đăng ký", tone: "neutral" },
  locked: { label: "Đã khoá", tone: "danger" },
};
