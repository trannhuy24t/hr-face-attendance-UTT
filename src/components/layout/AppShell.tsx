import type { ReactNode } from "react";
import {
  DashboardOutlined,
  TeamOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  WalletOutlined,
  TabletOutlined,
  SettingOutlined,
} from "@ant-design/icons";

export type NavKey =
  | "dashboard"
  | "employees"
  | "schedule"
  | "attendance"
  | "leave"
  | "payroll"
  | "kiosk"
  | "settings";

interface NavItem {
  key: NavKey;
  label: string;
  icon: ReactNode;
  href?: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: <DashboardOutlined />, href: "#dashboard" },
  { key: "employees", label: "Nhân viên", icon: <TeamOutlined />, href: "#employees" },
  { key: "schedule", label: "Lịch phân ca", icon: <CalendarOutlined />, href: "#schedule" },
  { key: "attendance", label: "Chấm công", icon: <ClockCircleOutlined />, href: "#attendance" },
  { key: "leave", label: "Đơn nghỉ phép", icon: <FileTextOutlined />, href: "#leave" },
  { key: "payroll", label: "Bảng lương", icon: <WalletOutlined />, href: "#payroll" },
  { key: "kiosk", label: "Thiết bị Kiosk", icon: <TabletOutlined />, href: "#kiosk" },
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
            <div className="avatar">NT</div>
            <div className="menu-user-info">
              <div className="text-sm">Nguyễn Thu</div>
              <div className="text-xs text-muted">Quản trị viên</div>
            </div>
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
