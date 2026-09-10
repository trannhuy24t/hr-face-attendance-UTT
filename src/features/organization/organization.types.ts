export interface Branch {
  id: string;
  name: string;
  timezone: string;
  currency: string;
  weeklyOffDays: number[] | null;
  createdAt: string;
  _count?: { departments: number; employees: number };
}

export interface BranchDetail extends Branch {
  departments: Department[];
}

export interface Department {
  id: string;
  branchId: string;
  name: string;
  code: string;
  createdAt: string;
}

export interface Holiday {
  id: string;
  tenantId: string | null;
  branchId: string | null;
  name: string;
  startDate: string;
  endDate: string;
  isPaid: boolean;
  multiplierRate: number;
  createdAt: string;
  branch?: { id: string; name: string } | null;
}

export const WEEKDAY_LABEL: Record<number, string> = {
  0: "CN",
  1: "T2",
  2: "T3",
  3: "T4",
  4: "T5",
  5: "T6",
  6: "T7",
};
