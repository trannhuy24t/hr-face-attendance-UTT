import { useState } from "react";
import { CalendarOutlined, LockOutlined, WarningOutlined, ReloadOutlined } from "@ant-design/icons";
import { AppShell } from "../../components/layout/AppShell";
import { ChipFilter, ToggleChip } from "../../components/filters/ChipFilter";
import { useAsyncData } from "../../lib/useAsyncData";
import { initialsOf } from "../../lib/textUtils";
import { formatSignedVnd, formatVnd } from "../../lib/money";
import { fetchPayroll } from "./payroll.api";
import { BIOMETRIC_LABEL, PAYROLL_STATUS_LABEL } from "./payroll.types";

export default function PayrollPage() {
  const [branch, setBranch] = useState("Tất cả");
  const [department, setDepartment] = useState("Tất cả");
  const [claimOnly, setClaimOnly] = useState(false);

  const [state, reload] = useAsyncData(
    (signal) => fetchPayroll({ branch, department, claimOnly }, signal),
    [branch, department, claimOnly],
  );

  const totalDisplayed = state.status === "success" ? state.data.totalDisplayed : 0;

  return (
    <AppShell
      activeKey="payroll"
      title={state.status === "success" ? `Bảng lương kỳ ${state.data.periodLabel}` : "Bảng lương"}
      subtitle={
        state.status === "success"
          ? `${state.data.rows.length} nhân viên · hạn chốt ${state.data.deadlineLabel}`
          : undefined
      }
      actions={
        <>
          <button className="btn btn-outline btn-sm" type="button">
            <CalendarOutlined />
            Chọn kỳ lương
          </button>
          <button className="btn btn-primary btn-sm" type="button">
            <LockOutlined />
            Chốt &amp; khoá kỳ lương
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
                <ToggleChip active={claimOnly} onClick={() => setClaimOnly((v) => !v)} tone="danger">
                  Chỉ dòng có khiếu nại
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
                    <th>Công</th>
                    <th style={{ textAlign: "right" }}>Lương cơ bản</th>
                    <th style={{ textAlign: "right" }}>Phụ cấp / trừ</th>
                    <th>Sinh trắc học</th>
                    <th style={{ textAlign: "right" }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {state.status === "loading"
                    ? Array.from({ length: 6 }).map((_, index) => (
                        <tr key={index}>
                          <td colSpan={8}>
                            <div className="skeleton" style={{ height: 20 }} />
                          </td>
                        </tr>
                      ))
                    : state.data.rows.map((row) => {
                        const status = PAYROLL_STATUS_LABEL[row.status];
                        const bio = BIOMETRIC_LABEL[row.biometricStatus];
                        return (
                          <tr key={row.id}>
                            <td>
                              <div className="avatar">{initialsOf(row.name)}</div>
                            </td>
                            <td>
                              <div className="cell-copy">
                                <strong>{row.name}</strong>
                                <small>
                                  {row.branch} · {row.code}
                                </small>
                              </div>
                            </td>
                            <td>{row.department}</td>
                            <td>{row.workdays}</td>
                            <td className="table-num" style={{ textAlign: "right" }}>
                              {formatVnd(row.base)}
                            </td>
                            <td
                              className="table-num"
                              style={{
                                textAlign: "right",
                                color:
                                  row.adjustment > 0
                                    ? "var(--color-success)"
                                    : row.adjustment < 0
                                      ? "var(--color-danger)"
                                      : "var(--color-text-muted)",
                              }}
                            >
                              {formatSignedVnd(row.adjustment)}
                            </td>
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
              {state.status === "success" && state.data.rows.length === 0 ? (
                <div className="table-empty">Không có dòng lương nào khớp bộ lọc hiện tại.</div>
              ) : null}
            </div>

            {state.status === "success" ? (
              <div className="table-foot">
                <span>Hiển thị {state.data.rows.length} dòng lương</span>
                <div className="flex items-center gap-4">
                  <span>
                    Tổng chi hiển thị{" "}
                    <strong className="text-sm" style={{ color: "var(--color-text)" }}>
                      {formatVnd(totalDisplayed)}
                    </strong>
                  </span>
                  <a className="link-primary text-xs" href="#">
                    Xuất bảng lương
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}
    </AppShell>
  );
}
