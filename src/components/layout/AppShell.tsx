import type { ReactNode } from "react";
import { useState } from "react";
import {
  DashboardOutlined,
  TeamOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  WalletOutlined,
  CarryOutOutlined,
  TabletOutlined,
  UserSwitchOutlined,
  SettingOutlined,
  LogoutOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { logout } from "../../features/auth/auth.api";
import { clearAccessToken, clearCurrentUser, getCurrentUser } from "../../features/auth/authSession";
import { ROLE_LABEL } from "../../lib/roles";
import { initialsOf } from "../../lib/textUtils";

export type NavKey =
  | "dashboard"
  | "employees"
  | "branches"
  | "schedule"
  | "attendance"
  | "leave"
  | "payroll"
  | "holidays"
  | "kiosk"
  | "users"
  | "settings";

interface NavItem {
  key: NavKey;
  label: string;
  icon: ReactNode;
  href?: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: <DashboardOutlined /> },
  { key: "employees", label: "Nhân viên", icon: <TeamOutlined />, href: "#employees" },
  { key: "branches", label: "Chi nhánh & Phòng ban", icon: <ApartmentOutlined />, href: "#branches" },
  { key: "schedule", label: "Ca làm việc", icon: <CalendarOutlined />, href: "#schedule" },
  { key: "attendance", label: "Chấm công", icon: <ClockCircleOutlined /> },
  { key: "leave", label: "Đơn nghỉ phép", icon: <FileTextOutlined /> },
  { key: "payroll", label: "Bảng lương", icon: <WalletOutlined /> },
  { key: "holidays", label: "Ngày nghỉ lễ", icon: <CarryOutOutlined />, href: "#holidays" },
  { key: "kiosk", label: "Thiết bị Kiosk", icon: <TabletOutlined /> },
  { key: "users", label: "Tài khoản & Phân quyền", icon: <UserSwitchOutlined />, href: "#users" },
  { key: "settings", label: "Cài đặt", icon: <SettingOutlined />, href: "#settings" },
];

interface AppShellProps {
  activeKey: NavKey;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppShell({
  activeKey,
  title,
  subtitle,
  actions,
  children,
}: AppShellProps) {
  const [loggingOut, setLoggingOut] = useState(false);
  const user = getCurrentUser();
  const primaryRole = user?.roles[0]?.role;

  const handleLogout = () => {
    setLoggingOut(true);
    logout()
      .catch(() => {})
      .finally(() => {
        clearAccessToken();
        clearCurrentUser();
        window.location.hash = "";
      });
  };

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">F&amp;B</div>
          <div className="sidebar-brand-text">
            <strong>UTT Portal</strong>
            <small>Hệ thống F&amp;B</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) =>
            item.href ? (
              <a
                key={item.key}
                href={item.href}
                className={`nav-item${item.key === activeKey ? " is-active" : ""}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </a>
            ) : (
              <span
                key={item.key}
                className={`nav-item${item.key === activeKey ? " is-active" : " is-disabled"}`}
                aria-disabled="true"
                title="Sắp ra mắt"
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </span>
            ),
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar">{user ? initialsOf(user.fullName) : "?"}</div>
            <div className="menu-user-info" style={{ flex: 1, minWidth: 0 }}>
              <div className="text-sm truncate">{user?.fullName ?? "Tài khoản"}</div>
              <div className="text-xs text-muted truncate">
                {primaryRole ? ROLE_LABEL[primaryRole as keyof typeof ROLE_LABEL] : "—"}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              aria-label="Đăng xuất"
              title="Đăng xuất"
              disabled={loggingOut}
              onClick={handleLogout}
            >
              {loggingOut ? <LoadingOutlined /> : <LogoutOutlined />}
            </button>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div>
            <h1 className="topbar-title">{title}</h1>
            {subtitle ? <p className="topbar-meta">{subtitle}</p> : null}
          </div>
          {actions ? <div className="topbar-actions">{actions}</div> : null}
        </header>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
