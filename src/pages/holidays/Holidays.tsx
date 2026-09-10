import { useState } from "react";
import { PlusOutlined, EditOutlined, DeleteOutlined, WarningOutlined, ReloadOutlined } from "@ant-design/icons";
import { AppShell } from "../../components/layout/AppShell";
import { ChipFilter } from "../../components/filters/ChipFilter";
import { Modal } from "../../components/ui/Modal";
import { useAsyncData } from "../../lib/useAsyncData";
import { ApiError } from "../../lib/httpClient";
import {
  fetchBranches,
  fetchHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from "../../features/organization/organization.api";
import type { Holiday } from "../../features/organization/organization.types";

const TENANT_WIDE = "Toàn hệ thống";

interface HolidayFormState {
  name: string;
  startDate: string;
  endDate: string;
  branchName: string;
  isPaid: boolean;
  multiplierRate: string;
}

function emptyForm(): HolidayFormState {
  return { name: "", startDate: "", endDate: "", branchName: TENANT_WIDE, isPaid: true, multiplierRate: "1.0" };
}

export default function HolidaysPage() {
  const [branchFilter, setBranchFilter] = useState("Tất cả");
  const [modal, setModal] = useState<{ mode: "create" | "edit"; holiday?: Holiday } | null>(null);
  const [form, setForm] = useState<HolidayFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [branchesState] = useAsyncData((signal) => fetchBranches(signal), []);
  const branches = branchesState.status === "success" ? branchesState.data : [];

  const filterBranchId = branchFilter === "Tất cả" ? undefined : branches.find((b) => b.name === branchFilter)?.id;

  const [state, reload] = useAsyncData((signal) => fetchHolidays(filterBranchId, signal), [filterBranchId]);

  const openCreate = () => {
    setForm(emptyForm());
    setFormError("");
    setModal({ mode: "create" });
  };

  const openEdit = (holiday: Holiday) => {
    setForm({
      name: holiday.name,
      startDate: holiday.startDate.slice(0, 10),
      endDate: holiday.endDate.slice(0, 10),
      branchName: holiday.branch?.name ?? TENANT_WIDE,
      isPaid: holiday.isPaid,
      multiplierRate: String(holiday.multiplierRate),
    });
    setFormError("");
    setModal({ mode: "edit", holiday });
  };

  const submit = () => {
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      setFormError("Vui lòng nhập đủ tên và khoảng ngày nghỉ");
      return;
    }
    const rate = Number(form.multiplierRate);
    if (Number.isNaN(rate) || rate < 0) {
      setFormError("Hệ số nhân lương không hợp lệ");
      return;
    }
    setSaving(true);
    setFormError("");
    const branchId = form.branchName === TENANT_WIDE ? undefined : branches.find((b) => b.name === form.branchName)?.id;
    const payload = {
      name: form.name.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      branchId,
      isPaid: form.isPaid,
      multiplierRate: rate,
    };
    const request =
      modal?.mode === "edit" && modal.holiday ? updateHoliday(modal.holiday.id, payload) : createHoliday(payload);

    request
      .then(() => {
        setModal(null);
        reload();
      })
      .catch((error: unknown) => {
        setFormError(error instanceof ApiError ? error.message : "Không thể lưu ngày nghỉ lễ.");
      })
      .finally(() => setSaving(false));
  };

  const handleDelete = (holiday: Holiday) => {
    if (!window.confirm(`Xoá ngày nghỉ lễ "${holiday.name}"?`)) return;
    deleteHoliday(holiday.id)
      .then(() => reload())
      .catch((error: unknown) => {
        window.alert(error instanceof ApiError ? error.message : "Không thể xoá ngày nghỉ lễ.");
      });
  };

  return (
    <AppShell
      activeKey="holidays"
      title="Ngày nghỉ lễ"
      subtitle={state.status === "success" ? `${state.data.length} ngày nghỉ` : undefined}
      actions={
        <button className="btn btn-primary btn-sm" type="button" onClick={openCreate}>
          <PlusOutlined />
          Thêm ngày nghỉ
        </button>
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
              options={["Tất cả", ...branches.map((b) => b.name)]}
              value={branchFilter}
              onChange={setBranchFilter}
            />
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tên ngày nghỉ</th>
                  <th>Từ ngày</th>
                  <th>Đến ngày</th>
                  <th>Áp dụng</th>
                  <th>Hưởng lương</th>
                  <th>Hệ số</th>
                  <th style={{ textAlign: "right" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {state.status === "loading"
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <tr key={index}>
                        <td colSpan={7}>
                          <div className="skeleton" style={{ height: 20 }} />
                        </td>
                      </tr>
                    ))
                  : state.status === "success"
                    ? state.data.map((holiday) => (
                        <tr key={holiday.id}>
                          <td>
                            <strong>{holiday.name}</strong>
                          </td>
                          <td>{holiday.startDate.slice(0, 10)}</td>
                          <td>{holiday.endDate.slice(0, 10)}</td>
                          <td className="text-xs text-muted">{holiday.branch?.name ?? TENANT_WIDE}</td>
                          <td>
                            <span className={`badge badge-${holiday.isPaid ? "success" : "neutral"}`}>
                              {holiday.isPaid ? "Có lương" : "Không lương"}
                            </span>
                          </td>
                          <td>{holiday.multiplierRate}x</td>
                          <td style={{ textAlign: "right" }}>
                            <div className="flex items-center gap-2" style={{ justifyContent: "flex-end" }}>
                              <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(holiday)}>
                                <EditOutlined />
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleDelete(holiday)}
                              >
                                <DeleteOutlined style={{ color: "var(--color-danger)" }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    : null}
              </tbody>
            </table>
            {state.status === "success" && state.data.length === 0 ? (
              <div className="table-empty">Chưa có ngày nghỉ lễ nào khớp bộ lọc.</div>
            ) : null}
          </div>
        </div>
      )}

      {modal ? (
        <Modal
          title={modal.mode === "create" ? "Thêm ngày nghỉ lễ" : `Sửa ngày nghỉ: ${modal.holiday?.name}`}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-outline btn-sm" type="button" onClick={() => setModal(null)}>
                Huỷ
              </button>
              <button className="btn btn-primary btn-sm" type="button" disabled={saving} onClick={submit}>
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </>
          }
        >
          {formError ? (
            <div className="alert alert-danger">
              <WarningOutlined />
              <span>{formError}</span>
            </div>
          ) : null}
          <div className="form-group">
            <label className="label">Tên ngày nghỉ</label>
            <input
              className="input"
              style={{ paddingInline: 12 }}
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Tết Dương lịch"
            />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="label">Từ ngày</label>
              <input
                className="input"
                style={{ paddingInline: 12 }}
                type="date"
                value={form.startDate}
                onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="label">Đến ngày</label>
              <input
                className="input"
                style={{ paddingInline: 12 }}
                type="date"
                value={form.endDate}
                onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Áp dụng cho</label>
            <select
              className="input"
              style={{ paddingInline: 12 }}
              value={form.branchName}
              onChange={(event) => setForm((prev) => ({ ...prev, branchName: event.target.value }))}
            >
              <option value={TENANT_WIDE}>{TENANT_WIDE}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="label">Hệ số nhân lương</label>
              <input
                className="input"
                style={{ paddingInline: 12 }}
                type="number"
                step="0.1"
                min="0"
                value={form.multiplierRate}
                onChange={(event) => setForm((prev) => ({ ...prev, multiplierRate: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="label">&nbsp;</label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.isPaid}
                  onChange={(event) => setForm((prev) => ({ ...prev, isPaid: event.target.checked }))}
                />
                Ngày nghỉ hưởng lương
              </label>
            </div>
          </div>
        </Modal>
      ) : null}
    </AppShell>
  );
}
