import type { UserRole } from "../features/auth/auth.types";

export type BranchRole = "owner" | "manager" | "accountant" | "staff";

export const ROLE_LABEL: Record<BranchRole, string> = {
  owner: "Chủ sở hữu",
  manager: "Quản lý",
  accountant: "Kế toán",
  staff: "Nhân viên",
};

export function hasRole(roles: UserRole[] | undefined, ...allowed: BranchRole[]): boolean {
  if (!roles || roles.length === 0) return true; // unknown session (e.g. after reload) — let the API be the source of truth
  return roles.some((r) => allowed.includes(r.role as BranchRole));
}
