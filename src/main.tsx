import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import LoginPage from "./pages/login/Login.tsx";
import RegisterPage from "./pages/register/Register.tsx";
import DashboardPage from "./pages/dashboard/Dashboard.tsx";
import EmployeesPage from "./pages/employees/Employees.tsx";
import SchedulePage from "./pages/schedule/Schedule.tsx";
import AttendancePage from "./pages/attendance/Attendance.tsx";
import LeavePage from "./pages/leave/Leave.tsx";
import PayrollPage from "./pages/payroll/Payroll.tsx";
import KioskPage from "./pages/kiosk/Kiosk.tsx";
import SettingsPage from "./pages/settings/Settings.tsx";
import "../global.css";

const PORTAL_PAGES: Record<string, () => React.JSX.Element> = {
  dashboard: DashboardPage,
  employees: EmployeesPage,
  schedule: SchedulePage,
  attendance: AttendancePage,
  leave: LeavePage,
  payroll: PayrollPage,
  kiosk: KioskPage,
  settings: SettingsPage,
};

const readRoute = () => window.location.hash.slice(1);

function RootApp() {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const onHashChange = () => setRoute(readRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

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
