export type BranchRole = "owner" | "manager" | "accountant" | "staff";

export interface CreatedUser {
  id: string;
  tenantId: string;
  employeeId: string | null;
  email: string;
  fullName: string;
  createdAt: string;
}

export interface UserRoleAssignment {
  id: string;
  userId: string;
  branchId: string | null;
  role: BranchRole;
  branch: { id: string; name: string } | null;
}
