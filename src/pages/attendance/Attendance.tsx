import { useState } from "react";
import { CalendarOutlined, LockOutlined, WarningOutlined, ReloadOutlined } from "@ant-design/icons";
import { AppShell } from "../../components/layout/AppShell";
import { ChipFilter, ToggleChip } from "../../components/filters/ChipFilter";
import { useAsyncData } from "../../lib/useAsyncData";
import { initialsOf } from "../../lib/textUtils";
import { fetchAttendance } from "./attendance.api";
import { ATTENDANCE_STATUS_LABEL, BIOMETRIC_LABEL } from "./attendance.types";

export default function AttendancePage() {
  const [branch, setBranch] = useState("Tất cả");
  const [department, setDepartment] = useState("Tất cả");
  const [issueOnly, setIssueOnly] = useState(false);

  const [state, reload] = useAsyncData(
    (signal) => fetchAttendance({ branch, department, issueOnly }, signal),
    [branch, department, issueOnly],
  );

  return (
    <AppShell
      activeKey="attendance"
      title="Bảng chấm công real-time"
      subtitle={
        state.status === "success"
          ? `${state.data.dateLabel} · dữ liệu cập nhật liên tục từ kiosk`
          : undefined
      }
      actions={
        <>
          <button className="btn btn-outline btn-sm" type="button">
            <CalendarOutlined />
            Hôm nay
          </button>
          <button className="btn btn-primary btn-sm" type="button">
            <LockOutlined />
            Chốt bảng công
          </button>
        </>
      }
    >
      {state.status === "error" ? (
        <div className="card empty-state">
          <WarningOutlined style={{ fontSize: 28, color: "var(--color-danger)" }} />
          <p>{state.message}</p>
          <button className="btn btn-outline btn-sm mt-2" type="button" onClick={reload}>
            <ReloadOutlined />
            Thử lại
          </button>
        </div>
      ) : (
        <>
          <div className="kpi-grid">
            {state.status === "loading"
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="card stat-tile">
                    <div className="skeleton" style={{ height: 16, width: "60%" }} />
                    <div className="skeleton" style={{ height: 28, width: "40%" }} />
                  </div>
                ))
              : state.data.summary.map((card) => (
                  <div key={card.title} className="card stat-tile">
                    <div className="stat-tile-head">
                      <span className="stat-label">{card.title}</span>
                      <span className={`badge badge-${card.tone}`}>{card.badge}</span>
                    </div>
                    <span className="stat-value">
                      {card.value} <span className="stat-hint">{card.unit}</span>
                    </span>
                  </div>
                ))}
          </div>

          <div className="card">
            <div className="filter-bar">
              <ChipFilter
                label="Chi nhánh"
                options={["Tất cả", ...(state.status === "success" ? state.data.branches : [])]}
                value={branch}
                onChange={setBranch}
              />
              <ChipFilter
                label="Phòng ban"
                options={["Tất cả", ...(state.status === "success" ? state.data.departments : [])]}
                value={department}
                onChange={setDepartment}
              />
              <div className="filter-spacer">
                <ToggleChip active={issueOnly} onClick={() => setIssueOnly((v) => !v)}>
                  Chờ trường hợp cần xử lý
                </ToggleChip>
              </div>
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Nhân viên</th>
                    <th>Phòng ban</th>
                    <th>Ca</th>
                    <th>Giờ vào</th>
                    <th>Giờ ra</th>
                    <th>Nguồn chấm</th>
                    <th>Sinh trắc học</th>
                    <th style={{ textAlign: "right" }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {state.status === "loading"
                    ? Array.from({ length: 6 }).map((_, index) => (
                        <tr key={index}>
                          <td colSpan={9}>
                            <div className="skeleton" style={{ height: 20 }} />
                          </td>
                        </tr>
                      ))
                    : state.data.records.map((record) => {
                        const status = ATTENDANCE_STATUS_LABEL[record.status];
                        const bio = BIOMETRIC_LABEL[record.biometricStatus];
                        return (
                          <tr key={record.id}>
                            <td>
                              <div className="avatar">{initialsOf(record.name)}</div>
                            </td>
                            <td>
                              <div className="cell-copy">
                                <strong>{record.name}</strong>
                                <small>
                                  {record.branch} · {record.code}
                                </small>
                              </div>
                            </td>
                            <td>{record.department}</td>
                            <td>{record.shift}</td>
                            <td
                              style={{
                                color:
                                  record.status === "late"
                                    ? "var(--color-warning)"
                                    : "var(--color-text)",
                              }}
                            >
                              {record.checkIn}
                            </td>
                            <td>{record.checkOut}</td>
                            <td className="text-xs text-muted">{record.source}</td>
                            <td>
                              <span className={`badge badge-${bio.tone}`}>{bio.label}</span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <span className={`badge badge-${status.tone}`}>{status.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
              {state.status === "success" && state.data.records.length === 0 ? (
                <div className="table-empty">Không có bản ghi nào khớp bộ lọc hiện tại.</div>
              ) : null}
            </div>

            {state.status === "success" ? (
              <div className="table-foot">
                <span>
                  Hiển thị {state.data.records.length} bản ghi · cập nhật{" "}
                  {new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(
                    new Date(state.data.updatedAt),
                  )}
                </span>
                <a className="link-primary text-xs" href="#">
                  Xuất CSV
                </a>
              </div>
            ) : null}
          </div>
        </>
      )}
    </AppShell>
  );
}
