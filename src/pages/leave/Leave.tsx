import { useState } from "react";
import { CalendarOutlined, PlusOutlined, WarningOutlined, ReloadOutlined } from "@ant-design/icons";
import { AppShell } from "../../components/layout/AppShell";
import { ChipFilter } from "../../components/filters/ChipFilter";
import { useAsyncData } from "../../lib/useAsyncData";
import { initialsOf } from "../../lib/textUtils";
import { fetchLeaveRequests } from "./leave.api";
import { LEAVE_STATUS_LABEL } from "./leave.types";

const STATUS_TABS = ["Tất cả", "Chờ duyệt", "Đã duyệt", "Từ chối"];

export default function LeavePage() {
  const [branch, setBranch] = useState("Tất cả");
  const [department, setDepartment] = useState("Tất cả");
  const [status, setStatus] = useState("Tất cả");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [state, reload] = useAsyncData(
    (signal) => fetchLeaveRequests({ branch, department, status }, signal),
    [branch, department, status],
  );

  const requests = state.status === "success" ? state.data.requests : [];
  const selected = requests.find((r) => r.id === selectedId) ?? requests[0] ?? null;

  return (
    <AppShell
      activeKey="leave"
      title="Đơn nghỉ phép"
      subtitle={
        state.status === "success"
          ? `${state.data.pendingCount} đơn chờ duyệt · ${state.data.overdueCount} đơn quá hạn 48 giờ`
          : undefined
      }
      actions={
        <>
          <button className="btn btn-outline btn-sm" type="button">
            <CalendarOutlined />
            Tháng này
          </button>
          <button className="btn btn-primary btn-sm" type="button">
            <PlusOutlined />
            Tạo đơn mới
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
                <div className="chip-row">
                  {STATUS_TABS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={`chip${tab === status ? " is-active" : ""}`}
                      onClick={() => setStatus(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="panel-grid">
            <div className="card">
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Nhân viên</th>
                      <th>Loại nghỉ</th>
                      <th>Thời gian</th>
                      <th>Số ngày</th>
                      <th style={{ textAlign: "right" }}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.status === "loading"
                      ? Array.from({ length: 5 }).map((_, index) => (
                          <tr key={index}>
                            <td colSpan={6}>
                              <div className="skeleton" style={{ height: 20 }} />
                            </td>
                          </tr>
                        ))
                      : requests.map((request) => {
                          const statusMeta = LEAVE_STATUS_LABEL[request.status];
                          return (
                            <tr
                              key={request.id}
                              className={`is-clickable${request.id === selected?.id ? " is-selected" : ""}`}
                              onClick={() => setSelectedId(request.id)}
                            >
                              <td>
                                <div className="avatar">{initialsOf(request.name)}</div>
                              </td>
                              <td>
                                <div className="cell-copy">
                                  <strong>{request.name}</strong>
                                  <small>
                                    {request.department} · {request.branch}
                                  </small>
                                </div>
                              </td>
                              <td>{request.type}</td>
                              <td>
                                <div className="cell-copy">
                                  <span className="text-sm">{request.range}</span>
                                  <small>Gửi {request.submittedAt}</small>
                                </div>
                              </td>
                              <td>{request.days}</td>
                              <td style={{ textAlign: "right" }}>
                                <span className={`badge badge-${statusMeta.tone}`}>
                                  {statusMeta.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
                {state.status === "success" && requests.length === 0 ? (
                  <div className="table-empty">Không có đơn nào khớp bộ lọc hiện tại.</div>
                ) : null}
              </div>
              {state.status === "success" ? (
                <div className="table-foot">
                  <span>
                    Hiển thị {requests.length} / {requests.length} đơn
                  </span>
                  <a className="link-primary text-xs" href="#">
                    Xuất danh sách
                  </a>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-4">
              {state.status === "loading" ? (
                <div className="card">
                  <div className="skeleton" style={{ height: 220 }} />
                </div>
              ) : selected ? (
                <div className="card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="avatar">{initialsOf(selected.name)}</div>
                      <div>
                        <div className="text-sm" style={{ fontWeight: 500 }}>
                          {selected.name}
                        </div>
                        <div className="text-xs text-muted">
                          {selected.department} · {selected.branch}
                        </div>
                      </div>
                    </div>
                    <span className={`badge badge-${LEAVE_STATUS_LABEL[selected.status].tone}`}>
                      {LEAVE_STATUS_LABEL[selected.status].label}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 mt-4">
                    <div className="kv-row">
                      <span className="kv-label">Mã đơn</span>
                      <span className="kv-value">{selected.id}</span>
                    </div>
                    <div className="kv-row">
                      <span className="kv-label">Loại nghỉ</span>
                      <span className="kv-value">{selected.type}</span>
                    </div>
                    <div className="kv-row">
                      <span className="kv-label">Thời gian</span>
                      <span className="kv-value">{selected.range}</span>
                    </div>
                    <div className="kv-row">
                      <span className="kv-label">Số ngày</span>
                      <span className="kv-value">{selected.days} ngày</span>
                    </div>
                    <div className="kv-row">
                      <span className="kv-label">Gửi lúc</span>
                      <span className="kv-value">{selected.submittedAt}</span>
                    </div>
                    <div className="kv-row">
                      <span className="kv-label">Phép năm còn lại</span>
                      <span className="kv-value">{selected.remainingLeaveDays}</span>
                    </div>
                  </div>

                  <div className={`alert mt-4 ${selected.overdue ? "alert-danger" : ""}`}>
                    <span>
                      {selected.overdue ? "Quá hạn duyệt 48 giờ. " : ""}
                      {selected.reason}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <button className="btn btn-primary flex-1" type="button">
                      Duyệt đơn
                    </button>
                    <button className="btn btn-outline flex-1" type="button" style={{ color: "var(--color-danger)" }}>
                      Từ chối
                    </button>
                  </div>
                </div>
              ) : (
                <div className="card empty-state">Chưa có đơn nghỉ phép nào để hiển thị.</div>
              )}

              {selected && selected.impact.length > 0 ? (
                <div className="card">
                  <h2 className="text-sm" style={{ fontWeight: 500 }}>
                    Ảnh hưởng lịch ca
                  </h2>
                  <div className="flex flex-col gap-3 mt-4">
                    {selected.impact.map((impact, index) => (
                      <div key={index} className="kv-row">
                        <div>
                          <div className="text-sm">{impact.day}</div>
                          <div className="text-xs text-muted">{impact.shift}</div>
                        </div>
                        <span className={`badge badge-${impact.tone}`}>{impact.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
