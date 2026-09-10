import type { BadgeTone } from "../../lib/badge";

export type EmployeeStatus = "active" | "probation" | "suspended" | "terminated";

// Kept for the Attendance/Payroll mock pages, which have no backing API yet
// (see project notes) and still import this placeholder type.
export type BiometricStatus = "reviewed" | "pending" | "draft" | "locked";

export interface BranchRef {
  id: string;
  name: string;
}

export interface DepartmentRef {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  branchId: string;
  departmentId: string | null;
  status: EmployeeStatus;
  terminationDate: string | null;
  branch: BranchRef;
  department: DepartmentRef | null;
  createdAt: string;
  updatedAt: string;
}

export const EMPLOYEE_STATUS_LABEL: Record<EmployeeStatus, { label: string; tone: BadgeTone }> = {
  active: { label: "Đang làm việc", tone: "success" },
  probation: { label: "Thử việc", tone: "info" },
  suspended: { label: "Tạm đình chỉ", tone: "warning" },
  terminated: { label: "Đã nghỉ việc", tone: "danger" },
};

// Mirrors the backend's VALID_STATUS_TRANSITIONS map (employees.service.ts)
// so the UI only ever offers transitions the API will accept.
export const EMPLOYEE_STATUS_TRANSITIONS: Record<EmployeeStatus, EmployeeStatus[]> = {
  probation: ["active", "suspended", "terminated"],
  active: ["probation", "suspended", "terminated"],
  suspended: ["active", "terminated"],
  terminated: [],
};

export type PayBasis = "hourly" | "daily" | "shift" | "monthly";
export type ContractType = "full_time" | "part_time" | "internship";

export const PAY_BASIS_LABEL: Record<PayBasis, string> = {
  hourly: "Theo giờ",
  daily: "Theo ngày",
  shift: "Theo ca",
  monthly: "Theo tháng",
};

export const CONTRACT_TYPE_LABEL: Record<ContractType, string> = {
  full_time: "Toàn thời gian",
  part_time: "Bán thời gian",
  internship: "Thực tập",
};

export interface CompensationRecord {
  id: string;
  employeeId: string;
  branchId: string;
  contractType: ContractType;
  payBasis: PayBasis;
  rate: number | string;
  effectiveFrom: string;
  effectiveTo: string | null;
}
