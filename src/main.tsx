import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import LoginPage from "./pages/login/Login.tsx";
import RegisterPage from "./pages/register/Register.tsx";
import DashboardPage from "./pages/dashboard/Dashboard.tsx";
import EmployeesPage from "./pages/employees/Employees.tsx";
import BranchesPage from "./pages/branches/Branches.tsx";
import SchedulePage from "./pages/schedule/Schedule.tsx";
import AttendancePage from "./pages/attendance/Attendance.tsx";
import LeavePage from "./pages/leave/Leave.tsx";
import PayrollPage from "./pages/payroll/Payroll.tsx";
import HolidaysPage from "./pages/holidays/Holidays.tsx";
import KioskPage from "./pages/kiosk/Kiosk.tsx";
import UsersPage from "./pages/users/Users.tsx";
import SettingsPage from "./pages/settings/Settings.tsx";
import { refreshAccessToken } from "./features/auth/auth.api.ts";
import { setAccessToken } from "./features/auth/authSession.ts";
import "../global.css";

const PORTAL_PAGES: Record<string, () => React.JSX.Element> = {
  dashboard: DashboardPage,
  employees: EmployeesPage,
  branches: BranchesPage,
  schedule: SchedulePage,
  attendance: AttendancePage,
  leave: LeavePage,
  payroll: PayrollPage,
  holidays: HolidaysPage,
  kiosk: KioskPage,
  users: UsersPage,
  settings: SettingsPage,
};

const readRoute = () => window.location.hash.slice(1);

function RootApp() {
  const [route, setRoute] = useState(readRoute);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Access token only lives in memory (XSS hardening) and is wiped on every
  // page reload. Silently exchange the HttpOnly refresh cookie (if any) for
  // a fresh access token before rendering, so an existing session survives
  // a refresh instead of every protected page 401-ing.
  useEffect(() => {
    refreshAccessToken()
      .then((response) => setAccessToken(response.access_token))
      .catch(() => {})
      .finally(() => setBootstrapped(true));
  }, []);

  if (!bootstrapped) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-muted)",
        }}
      >
        Đang tải...
      </div>
    );
  }

  if (route === "register") return <RegisterPage />;
  const PortalPage = PORTAL_PAGES[route];
  if (PortalPage) return <PortalPage />;
  return <LoginPage />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootApp />
  </StrictMode>,
);
