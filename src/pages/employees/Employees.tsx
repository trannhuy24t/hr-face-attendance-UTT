import { useState } from "react";
import { UploadOutlined, PlusOutlined, WarningOutlined, ReloadOutlined } from "@ant-design/icons";
import { AppShell } from "../../components/layout/AppShell";
import { ChipFilter, ToggleChip } from "../../components/filters/ChipFilter";
import { useAsyncData } from "../../lib/useAsyncData";
import { initialsOf } from "../../lib/textUtils";
import { fetchEmployees } from "./employees.api";
import { ATTENDANCE_STATUS_LABEL, BIOMETRIC_LABEL } from "./employees.types";

const PAGE_SIZE = 10;

export default function EmployeesPage() {
  const [branch, setBranch] = useState("Tất cả");
  const [department, setDepartment] = useState("Tất cả");
  const [biometricPending, setBiometricPending] = useState(false);
  const [page, setPage] = useState(1);

  const [state, reload] = useAsyncData(
    (signal) =>
      fetchEmployees({ branch, department, biometricPending, page, pageSize: PAGE_SIZE }, signal),
    [branch, department, biometricPending, page],
  );

  const totalPages =
    state.status === "success" ? Math.max(1, Math.ceil(state.data.total / PAGE_SIZE)) : 1;

  return (
    <AppShell
      activeKey="employees"
      title="Danh sách nhân viên"
      subtitle={
        state.status === "success"
          ? `Hiển thị ${state.data.employees.length} / ${state.data.total} nhân viên`
          : undefined
      }
      actions={
        <>
          <button className="btn btn-outline btn-sm" type="button">
            <UploadOutlined />
            Nhập từ file
          </button>
          <button className="btn btn-primary btn-sm" type="button">
            <PlusOutlined />
            Thêm nhân viên
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
        <div className="card">
          <div className="filter-bar">
            <ChipFilter
              label="Chi nhánh"
              options={["Tất cả", ...(state.status === "success" ? state.data.branches : [])]}
              value={branch}
              onChange={(value) => {
                setBranch(value);
                setPage(1);
              }}
            />
            <ChipFilter
              label="Phòng ban"
              options={["Tất cả", ...(state.status === "success" ? state.data.departments : [])]}
              value={department}
              onChange={(value) => {
                setDepartment(value);
                setPage(1);
              }}
            />
            <div className="filter-spacer">
              <ToggleChip
                active={biometricPending}
                onClick={() => {
                  setBiometricPending((prev) => !prev);
                  setPage(1);
                }}
              >
                Chưa đăng ký sinh trắc học
              </ToggleChip>
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th></th>
                  <th>Nhân viên</th>
                  <th>Mã NV</th>
                  <th>Phòng ban</th>
                  <th>Chi nhánh</th>
                  <th>Sinh trắc học</th>
                  <th style={{ textAlign: "right" }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {state.status === "loading"
                  ? Array.from({ length: 6 }).map((_, index) => (
                      <tr key={index}>
                        <td colSpan={7}>
                          <div className="skeleton" style={{ height: 20 }} />
                        </td>
                      </tr>
                    ))
                  : state.status === "success"
                    ? state.data.employees.map((employee) => {
                        const bio = BIOMETRIC_LABEL[employee.biometricStatus];
                        const status = ATTENDANCE_STATUS_LABEL[employee.status];
                        return (
                          <tr key={employee.id}>
                            <td>
                              <div className="avatar">{initialsOf(employee.name)}</div>
                            </td>
                            <td>
                              <div className="cell-copy">
                                <strong>{employee.name}</strong>
                                <small>{employee.role}</small>
                              </div>
                            </td>
                            <td>{employee.code}</td>
                            <td>{employee.department}</td>
                            <td>{employee.branch}</td>
                            <td>
                              <div className="flex items-center gap-2">
                                <span className={`badge badge-${bio.tone}`}>{bio.label}</span>
                                <span className="text-xs text-muted">{employee.biometricMeta}</span>
                              </div>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <span className={`badge badge-${status.tone}`}>{status.label}</span>
                            </td>
                          </tr>
                        );
                      })
                    : null}
              </tbody>
            </table>
            {state.status === "success" && state.data.employees.length === 0 ? (
              <div className="table-empty">Không có nhân viên nào khớp bộ lọc hiện tại.</div>
            ) : null}
          </div>

          {state.status === "success" ? (
            <div className="table-foot">
              <span>
                Hiển thị {state.data.employees.length} / {state.data.total} nhân viên
              </span>
              <div className="pagination">
                <button
                  type="button"
                  className="page-btn"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Trước
                </button>
                <span className="page-btn is-active">{page}</span>
                <button
                  type="button"
                  className="page-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}
