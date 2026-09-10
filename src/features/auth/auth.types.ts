export interface RegisterPayload {
  companyName: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserRole {
  branch_id: string | null;
  role: "owner" | "manager" | "accountant" | "staff";
}

export interface RegisterResponseData {
  tenant: { id: string; name: string };
  user: { id: string; email: string; fullName: string; role: string };
  branch: { id: string; name: string; timezone: string; currency: string };
  access_token: string;
}

export interface LoginResponseData {
  user: { id: string; email: string; fullName: string; roles: UserRole[] };
  access_token: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  roles: UserRole[];
}
