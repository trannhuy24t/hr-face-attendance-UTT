import { useEffect, useState } from "react";
import {
  PlusOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  ReloadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { AppShell } from "../../components/layout/AppShell";
import { ChipFilter } from "../../components/filters/ChipFilter";
import { Modal } from "../../components/ui/Modal";
import { useAsyncData } from "../../lib/useAsyncData";
import { ApiError } from "../../lib/httpClient";
import { fetchBranches } from "../../features/organization/organization.api";
import { fetchEmployees } from "../employees/employees.api";
import type { Employee } from "../employees/employees.types";
import {
  fetchShifts,
  createShift,
  batchCreateShifts,
  updateShiftStatus,
  deleteShift,
} from "./schedule.api";
import { SHIFT_STATUS_LABEL, SHIFT_STATUS_TRANSITIONS, REASON_REQUIRED_STATUSES } from "./schedule.types";
import type { Shift, ShiftStatus } from "./schedule.types";

const PAGE_SIZE = 15;
const ALL = "Tất cả";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateTimeLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function ShiftStatusControl({ shift, onChanged }: { shift: Shift; onChanged: () => void }) {
  const options = SHIFT_STATUS_TRANSITIONS[shift.status];
  const [target, setTarget] = useState(options[0] ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTarget(options[0] ?? "");
  }, [shift.status]);

  if (options.length === 0) return null;

  const apply = () => {
    if (!target) return;
    let reason: string | undefined;
    if (REASON_REQUIRED_STATUSES.includes(target as ShiftStatus)) {
      const input = window.prompt("Nhập lý do (bắt buộc):");
      if (!input || !input.trim()) return;
      reason = input.trim();
    }
    setBusy(true);
    updateShiftStatus(shift.id, target as ShiftStatus, reason)
      .then(() => onChanged())
      .catch((error: unknown) => {
        window.alert(error instanceof ApiError ? error.message : "Không thể cập nhật trạng thái ca.");
      })
      .finally(() => setBusy(false));
  };

  return (
    <div className="flex items-center gap-1">
      <select
        className="input"
        style={{ paddingInline: 8, height: 32, fontSize: "var(--text-xs)" }}
        value={target}
        onChange={(event) => setTarget(event.target.value as ShiftStatus)}
      >
        {options.map((status) => (
          <option key={status} value={status}>
            {SHIFT_STATUS_LABEL[status].label}
          </option>
        ))}
      </select>
      <button className="btn btn-outline btn-sm" type="button" disabled={busy} onClick={apply}>
        {busy ? "..." : "Áp dụng"}
      </button>
    </div>
  );
}

export default function SchedulePage() {
  const [branchFilter, setBranchFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState<ShiftStatus | typeof ALL>(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const [branchesState] = useAsyncData((signal) => fetchBranches(signal), []);
  const branches = branchesState.status === "success" ? branchesState.data : [];
  const branchId = branchFilter === ALL ? undefined : branches.find((b) => b.name === branchFilter)?.id;
  const status = statusFilter === ALL ? undefined : statusFilter;

  const [state, reload] = useAsyncData(
    (signal) => fetchShifts({ branchId, status, from: from || undefined, to: to || undefined, page, pageSize: PAGE_SIZE }, signal),
    [branchId, status, from, to, page],
  );
  const shifts = state.status === "success" ? state.data.data : [];
  const meta = state.status === "success" ? state.data.meta : null;
  const totalPages = meta ? Math.max(1, meta.totalPages) : 1;

  // Employee roster for the create / batch-create pickers (active + probation only).
  const [employeesState] = useAsyncData(
    (signal) => fetchEmployees({ page: 1, pageSize: 100 }, signal),
    [],
  );
  const activeEmployees: Employee[] =
    employeesState.status === "success"
      ? employeesState.data.data.filter((e) => e.status === "active" || e.status === "probation")
      : [];

  // ---- Create shift ----
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    branchId: "",
    employeeId: "",
    shiftTemplateId: "",
    startTime: "",
    endTime: "",
  });
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState("");

  const openCreate = () => {
    const now = new Date();
    const later = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    setCreateForm({
      branchId: branches[0]?.id ?? "",
      employeeId: activeEmployees[0]?.id ?? "",
      shiftTemplateId: "",
      startTime: toDateTimeLocalInput(now),
      endTime: toDateTimeLocalInput(later),
    });
    setCreateError("");
    setCreateOpen(true);
  };

  // Branches / employees load asynchronously and may not have resolved yet
  // when the modal is opened — backfill the defaults once they arrive.
  useEffect(() => {
    if (!createOpen) return;
    setCreateForm((prev) => ({
      ...prev,
      branchId: prev.branchId || branches[0]?.id || "",
      employeeId: prev.employeeId || activeEmployees[0]?.id || "",
    }));
  }, [createOpen, branches, activeEmployees]);

  const submitCreate = () => {
    if (!createForm.branchId || !createForm.employeeId || !createForm.startTime || !createForm.endTime) {
      setCreateError("Vui lòng nhập đủ chi nhánh, nhân viên và thời gian ca");
      return;
    }
    setCreateSaving(true);
    setCreateError("");
    createShift({
      branchId: createForm.branchId,
      employeeId: createForm.employeeId,
      shiftTemplateId: createForm.shiftTemplateId.trim() || undefined,
      startTime: new Date(createForm.startTime).toISOString(),
      endTime: new Date(createForm.endTime).toISOString(),
    })
      .then(() => {
        setCreateOpen(false);
        reload();
      })
      .catch((error: unknown) => {
        setCreateError(error instanceof ApiError ? error.message : "Không thể tạo ca làm việc.");
      })
      .finally(() => setCreateSaving(false));
  };

  // ---- Batch create ----
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchForm, setBatchForm] = useState({
    branchId: "",
    shiftTemplateId: "",
    startDate: "",
    endDate: "",
    excludeWeeklyOff: true,
    employeeIds: [] as string[],
  });
  const [batchSaving, setBatchSaving] = useState(false);
  const [batchError, setBatchError] = useState("");

  const openBatch = () => {
    setBatchForm({
      branchId: branches[0]?.id ?? "",
      shiftTemplateId: "",
      startDate: "",
      endDate: "",
      excludeWeeklyOff: true,
      employeeIds: [],
    });
    setBatchError("");
    setBatchOpen(true);
  };

  useEffect(() => {
    if (!batchOpen) return;
    setBatchForm((prev) => ({ ...prev, branchId: prev.branchId || branches[0]?.id || "" }));
  }, [batchOpen, branches]);

  const submitBatch = () => {
    if (!batchForm.branchId || !batchForm.shiftTemplateId.trim() || !batchForm.startDate || !batchForm.endDate) {
      setBatchError("Vui lòng nhập đủ chi nhánh, mã ca mẫu và khoảng ngày");
      return;
    }
    if (batchForm.employeeIds.length === 0) {
      setBatchError("Chọn ít nhất 1 nhân viên");
      return;
    }
    setBatchSaving(true);
    setBatchError("");
    batchCreateShifts({
      branchId: batchForm.branchId,
      shiftTemplateId: batchForm.shiftTemplateId.trim(),
      employeeIds: batchForm.employeeIds,
      startDate: batchForm.startDate,
      endDate: batchForm.endDate,
      excludeWeeklyOff: batchForm.excludeWeeklyOff,
    })
      .then(() => {
        setBatchOpen(false);
        reload();
      })
      .catch((error: unknown) => {
        setBatchError(error instanceof ApiError ? error.message : "Không thể tạo ca hàng loạt.");
      })
      .finally(() => setBatchSaving(false));
  };

  const handleDelete = (shift: Shift) => {
    if (!window.confirm(`Xoá ca nháp của ${shift.employee.fullName}?`)) return;
    deleteShift(shift.id)
      .then(() => reload())
      .catch((error: unknown) => {
        window.alert(error instanceof ApiError ? error.message : "Không thể xoá ca làm việc.");
      });
  };

  return (
    <AppShell
      activeKey="schedule"
      title="Ca làm việc"
      subtitle={meta ? `${meta.totalItems} ca làm việc` : undefined}
      actions={
        <>
          <button className="btn btn-outline btn-sm" type="button" onClick={openBatch}>
            <ThunderboltOutlined />
            Tạo ca hàng loạt
          </button>
          <button className="btn btn-primary btn-sm" type="button" onClick={openCreate}>
            <PlusOutlined />
            Tạo ca
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
              options={[ALL, ...branches.map((b) => b.name)]}
              value={branchFilter}
              onChange={(value) => {
                setBranchFilter(value);
                setPage(1);
              }}
            />
            <ChipFilter
              label="Trạng thái"
              options={[ALL, ...Object.keys(SHIFT_STATUS_LABEL)]}
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value as ShiftStatus | typeof ALL);
                setPage(1);
              }}
            />
            <div className="filter-spacer flex items-center gap-2">
              <input
                className="input"
                style={{ paddingInline: 12, height: 36, width: 150 }}
                type="date"
                value={from}
                onChange={(event) => {
                  setFrom(event.target.value);
                  setPage(1);
                }}
              />
              <span className="text-xs text-muted">đến</span>
              <input
                className="input"
                style={{ paddingInline: 12, height: 36, width: 150 }}
                type="date"
                value={to}
                onChange={(event) => {
                  setTo(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th>Chi nhánh</th>
                  <th>Bắt đầu</th>
                  <th>Kết thúc</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: "right" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {state.status === "loading"
                  ? Array.from({ length: 6 }).map((_, index) => (
                      <tr key={index}>
                        <td colSpan={6}>
                          <div className="skeleton" style={{ height: 20 }} />
                        </td>
                      </tr>
                    ))
                  : state.status === "success"
                    ? shifts.map((shift) => {
                        const statusMeta = SHIFT_STATUS_LABEL[shift.status];
                        return (
                          <tr key={shift.id}>
                            <td>
                              <div className="cell-copy">
                                <strong>{shift.employee.fullName}</strong>
                                <small>{shift.employee.employeeCode}</small>
                              </div>
                            </td>
                            <td>
                              {shift.branch.name}
                              {shift.isCrossBranch ? (
                                <span className="badge badge-warning" style={{ marginLeft: 6 }}>
                                  Cross-branch
                                </span>
                              ) : null}
                            </td>
                            <td className="text-xs">{formatDateTime(shift.startTime)}</td>
                            <td className="text-xs">{formatDateTime(shift.endTime)}</td>
                            <td>
                              <span className={`badge badge-${statusMeta.tone}`}>{statusMeta.label}</span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <div className="flex items-center gap-2" style={{ justifyContent: "flex-end" }}>
                                <ShiftStatusControl shift={shift} onChanged={reload} />
                                {shift.status === "draft" ? (
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    title="Xoá ca nháp"
                                    onClick={() => handleDelete(shift)}
                                  >
                                    <DeleteOutlined style={{ color: "var(--color-danger)" }} />
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    : null}
              </tbody>
            </table>
            {state.status === "success" && shifts.length === 0 ? (
              <div className="table-empty">Không có ca làm việc nào khớp bộ lọc hiện tại.</div>
            ) : null}
          </div>

          {meta ? (
            <div className="table-foot">
              <span>
                Hiển thị {shifts.length} / {meta.totalItems} ca
              </span>
              <div className="pagination">
                <button type="button" className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
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

      {createOpen ? (
        <Modal
          title="Tạo ca làm việc"
          onClose={() => setCreateOpen(false)}
          footer={
            <>
              <button className="btn btn-outline btn-sm" type="button" onClick={() => setCreateOpen(false)}>
                Huỷ
              </button>
              <button className="btn btn-primary btn-sm" type="button" disabled={createSaving} onClick={submitCreate}>
                {createSaving ? "Đang tạo..." : "Tạo ca"}
              </button>
            </>
          }
        >
          {createError ? (
            <div className="alert alert-danger">
              <WarningOutlined />
              <span>{createError}</span>
            </div>
          ) : null}
          <div className="form-grid">
            <div className="form-group">
              <label className="label">Chi nhánh (nơi diễn ra ca)</label>
              <select
                className="input"
                style={{ paddingInline: 12 }}
                value={createForm.branchId}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, branchId: event.target.value }))}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Nhân viên</label>
              <select
                className="input"
                style={{ paddingInline: 12 }}
                value={createForm.employeeId}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, employeeId: event.target.value }))}
              >
                {activeEmployees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName} ({e.employeeCode})
                  </option>
                ))}
              </select>
              {employeesState.status === "success" && activeEmployees.length === 0 ? (
                <span className="text-xs text-danger">
                  Chưa có nhân viên đang hoạt động (active/probation) nào để xếp ca.
                </span>
              ) : null}
            </div>
            <div className="form-group">
              <label className="label">Bắt đầu</label>
              <input
                className="input"
                style={{ paddingInline: 12 }}
                type="datetime-local"
                value={createForm.startTime}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, startTime: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="label">Kết thúc</label>
              <input
                className="input"
                style={{ paddingInline: 12 }}
                type="datetime-local"
                value={createForm.endTime}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, endTime: event.target.value }))}
              />
            </div>
            <div className="form-group form-field-full">
              <label className="label">Mã ca mẫu (tuỳ chọn, nâng cao)</label>
              <input
                className="input"
                style={{ paddingInline: 12 }}
                value={createForm.shiftTemplateId}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, shiftTemplateId: event.target.value }))}
                placeholder="UUID ca mẫu nếu có"
              />
            </div>
          </div>
        </Modal>
      ) : null}

      {batchOpen ? (
        <Modal
          title="Tạo ca hàng loạt"
          subtitle="Cần mã ca mẫu (shift template) có sẵn trong hệ thống — hệ thống hiện chưa có màn hình quản lý ca mẫu."
          onClose={() => setBatchOpen(false)}
          wide
          footer={
            <>
              <button className="btn btn-outline btn-sm" type="button" onClick={() => setBatchOpen(false)}>
                Huỷ
              </button>
              <button className="btn btn-primary btn-sm" type="button" disabled={batchSaving} onClick={submitBatch}>
                {batchSaving ? "Đang tạo..." : "Tạo ca hàng loạt"}
              </button>
            </>
          }
        >
          {batchError ? (
            <div className="alert alert-danger">
              <WarningOutlined />
              <span>{batchError}</span>
            </div>
          ) : null}
          <div className="form-grid">
            <div className="form-group">
              <label className="label">Chi nhánh</label>
              <select
                className="input"
                style={{ paddingInline: 12 }}
                value={batchForm.branchId}
                onChange={(event) => setBatchForm((prev) => ({ ...prev, branchId: event.target.value }))}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Mã ca mẫu (UUID)</label>
              <input
                className="input"
                style={{ paddingInline: 12 }}
                value={batchForm.shiftTemplateId}
                onChange={(event) => setBatchForm((prev) => ({ ...prev, shiftTemplateId: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="label">Từ ngày</label>
              <input
                className="input"
                style={{ paddingInline: 12 }}
                type="date"
                value={batchForm.startDate}
                onChange={(event) => setBatchForm((prev) => ({ ...prev, startDate: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="label">Đến ngày</label>
              <input
                className="input"
                style={{ paddingInline: 12 }}
                type="date"
                value={batchForm.endDate}
                onChange={(event) => setBatchForm((prev) => ({ ...prev, endDate: event.target.value }))}
              />
            </div>
            <div className="form-group form-field-full">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={batchForm.excludeWeeklyOff}
                  onChange={(event) =>
                    setBatchForm((prev) => ({ ...prev, excludeWeeklyOff: event.target.checked }))
                  }
                />
                Loại trừ ngày nghỉ cố định trong tuần của chi nhánh
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="label">Nhân viên áp dụng</label>
            <div className="checklist">
              {activeEmployees.map((e) => {
                const checked = batchForm.employeeIds.includes(e.id);
                return (
                  <label key={e.id} className="checkbox">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setBatchForm((prev) => ({
                          ...prev,
                          employeeIds: checked
                            ? prev.employeeIds.filter((id) => id !== e.id)
                            : [...prev.employeeIds, e.id],
                        }))
                      }
                    />
                    {e.fullName} ({e.employeeCode})
                  </label>
                );
              })}
            </div>
          </div>
        </Modal>
      ) : null}
    </AppShell>
  );
}
