import { useEffect, useState } from "react";
import {
  CalendarOutlined,
  DownloadOutlined,
  ReloadOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { AppShell } from "../../components/layout/AppShell";
import { fetchDashboardOverview } from "./dashboard.api";
import type { BadgeTone, DashboardOverview } from "./dashboard.types";

type LoadState = "loading" | "error" | "success";

const TODAY_LABEL = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
}).format(new Date());

function formatTime(isoString: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoString));
}

export default function DashboardPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState("loading");
    fetchDashboardOverview(controller.signal)
      .then((overview) => {
        setData(overview);
        setState("success");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Đã có lỗi xảy ra",
        );
        setState("error");
      });
    return () => controller.abort();
  }, [reloadToken]);

  return (
    <AppShell
      activeKey="dashboard"
      title="Dashboard tổng quan"
      subtitle={
        state === "success" && data
          ? `${capitalize(TODAY_LABEL)} · Cập nhật lúc ${formatTime(data.updatedAt)}`
          : capitalize(TODAY_LABEL)
      }
      actions={
        <>
          <button className="btn btn-outline btn-sm" type="button">
            <CalendarOutlined />
            Hôm nay
          </button>
          <button className="btn btn-primary btn-sm" type="button">
            <DownloadOutlined />
            Xuất báo cáo
          </button>
        </>
      }
    >
      {state === "loading" ? <DashboardSkeleton /> : null}

      {state === "error" ? (
        <div className="card empty-state">
          <WarningOutlined style={{ fontSize: 28, color: "var(--color-danger)" }} />
          <p>{errorMessage}</p>
          <button
            className="btn btn-outline btn-sm mt-2"
            type="button"
            onClick={() => setReloadToken((token) => token + 1)}
          >
            <ReloadOutlined />
            Thử lại
          </button>
        </div>
      ) : null}

      {state === "success" && data ? <DashboardContent data={data} /> : null}
    </AppShell>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function DashboardSkeleton() {
  return (
    <>
      <div className="kpi-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card stat-tile">
            <div className="skeleton" style={{ height: 16, width: "60%" }} />
            <div className="skeleton" style={{ height: 28, width: "40%" }} />
            <div className="skeleton" style={{ height: 6, width: "100%" }} />
          </div>
        ))}
      </div>
      <div className="panel-grid">
        <div className="card">
          <div className="skeleton" style={{ height: 240 }} />
        </div>
        <div className="card">
          <div className="skeleton" style={{ height: 240 }} />
        </div>
      </div>
    </>
  );
}

function DashboardContent({ data }: { data: DashboardOverview }) {
  return (
    <>
      <div className="kpi-grid">
        <StatTile
          label="Có mặt hôm nay"
          badge={{ label: `${data.attendanceToday.percent}%`, tone: "success" }}
          value={`${data.attendanceToday.present} / ${data.attendanceToday.total} nhân viên`}
          hint={data.attendanceToday.deltaLabel}
          progressPercent={data.attendanceToday.percent}
          tone="success"
        />
        <StatTile
          label="Đi muộn"
          badge={
            data.lateArrivals.needsReview
              ? { label: "Cần xem", tone: "warning" }
              : { label: "Đã xử lý", tone: "neutral" }
          }
          value={`${data.lateArrivals.count} lượt`}
          hint={`${data.lateArrivals.noExplanationCount} lượt chưa có giải trình`}
          progressPercent={ratioPercent(data.lateArrivals.count, data.attendanceToday.total)}
          tone="warning"
        />
        <StatTile
          label="Đơn chờ duyệt"
          badge={{ label: "Pending", tone: "info" }}
          value={`${data.pendingLeave.count} đơn nghỉ phép`}
          hint={`${data.pendingLeave.overdueCount} đơn quá hạn ${data.pendingLeave.overdueHours} giờ`}
          progressPercent={ratioPercent(data.pendingLeave.count, data.attendanceToday.total)}
          tone="info"
        />
        <StatTile
          label="Kiosk offline"
          badge={{ label: "Offline", tone: "danger" }}
          value={`${data.kioskOffline.offlineCount} / ${data.kioskOffline.totalDevices} thiết bị`}
          hint={data.kioskOffline.note}
          progressPercent={ratioPercent(
            data.kioskOffline.offlineCount,
            data.kioskOffline.totalDevices,
          )}
          tone="danger"
        />
      </div>

      <div className="panel-grid">
        <section className="card">
          <div className="panel-header">
            <h2>Hoạt động gần đây</h2>
            <a className="link-primary text-sm" href="#">
              Xem tất cả
            </a>
          </div>
          <div className="panel-body">
            {data.recentActivity.length === 0 ? (
              <div className="empty-state">Chưa có hoạt động nào.</div>
            ) : (
              data.recentActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="avatar">{activity.initials}</div>
                  <div className="activity-copy">
                    <strong>{activity.title}</strong>
                    <span>{activity.detail}</span>
                  </div>
                  <div className="activity-meta">
                    <span className={`badge badge-${activity.status.tone}`}>
                      {activity.status.label}
                    </span>
                    <span className="activity-time">{activity.timeAgo}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="card">
            <div className="panel-header">
              <h2>Trạng thái Kiosk</h2>
            </div>
            <div className="panel-body">
              {data.kioskStatus.length === 0 ? (
                <div className="empty-state">Chưa có thiết bị nào.</div>
              ) : (
                data.kioskStatus.map((kiosk) => (
                  <div key={kiosk.id} className="status-item">
                    <div className="status-copy">
                      <strong>{kiosk.name}</strong>
                      <span>{kiosk.detail}</span>
                    </div>
                    <span
                      className={`badge badge-${kiosk.status === "online" ? "success" : "danger"}`}
                    >
                      {kiosk.status === "online" ? "Online" : "Offline"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="card">
            <div className="panel-header">
              <h2>Chờ xử lý</h2>
            </div>
            <div className="panel-body">
              {data.approvalQueue.length === 0 ? (
                <div className="empty-state">Không có yêu cầu nào.</div>
              ) : (
                data.approvalQueue.map((item) => (
                  <div key={item.id} className="approval-row">
                    <span className="approval-copy">{item.label}</span>
                    <span>
                      <span className="approval-count">{item.count}</span>
                      <button className="btn btn-outline btn-sm" type="button">
                        Duyệt
                      </button>
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function ratioPercent(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

interface StatTileProps {
  label: string;
  badge: { label: string; tone: BadgeTone };
  value: string;
  hint: string;
  progressPercent: number;
  tone: BadgeTone;
}

function StatTile({ label, badge, value, hint, progressPercent, tone }: StatTileProps) {
  return (
    <div className="card stat-tile">
      <div className="stat-tile-head">
        <span className="stat-label">{label}</span>
        <span className={`badge badge-${badge.tone}`}>{badge.label}</span>
      </div>
      <span className="stat-value">{value}</span>
      <div className="stat-progress-track">
        <div
          className={`stat-progress-fill tone-${tone}`}
          style={{ ["--pct" as string]: `${progressPercent}%` }}
        />
      </div>
      <span className="stat-hint">{hint}</span>
    </div>
  );
}
