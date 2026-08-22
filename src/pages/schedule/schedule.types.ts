import type { BadgeTone } from "../../lib/badge";

export type ShiftCode = "S" | "C" | "D" | "X" | "O";

export interface ScheduleDay {
  dow: string;
  date: string;
}

export interface ScheduleRow {
  id: string;
  name: string;
  meta: string;
  cells: ShiftCode[];
}

export interface ScheduleResponse {
  weekLabel: string;
  days: ScheduleDay[];
  branches: string[];
  departments: string[];
  rows: ScheduleRow[];
  gapCount: number;
}

export const SHIFT_META: Record<ShiftCode, { label: string; time: string; tone: BadgeTone | "off" }> = {
  S: { label: "Ca sáng", time: "08:00–17:00", tone: "info" },
  C: { label: "Ca chiều", time: "14:00–22:00", tone: "success" },
  D: { label: "Ca đêm", time: "22:00–06:00", tone: "warning" },
  X: { label: "Thiếu người", time: "Chưa phân", tone: "danger" },
  O: { label: "Nghỉ", time: "—", tone: "off" },
};
