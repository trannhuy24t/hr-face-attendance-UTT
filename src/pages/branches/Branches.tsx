import { useState } from "react";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  WarningOutlined,
  ReloadOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";
import { AppShell } from "../../components/layout/AppShell";
import { Modal } from "../../components/ui/Modal";
import { useAsyncData } from "../../lib/useAsyncData";
import { ApiError } from "../../lib/httpClient";
import {
  fetchBranches,
  fetchBranch,
  createBranch,
  updateBranch,
  deleteBranch,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../features/organization/organization.api";
import type { Branch, Department } from "../../features/organization/organization.types";
import { WEEKDAY_LABEL } from "../../features/organization/organization.types";

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

interface BranchFormState {
  name: string;
  timezone: string;
  currency: string;
  weeklyOffDays: number[];
}

const EMPTY_BRANCH_FORM: BranchFormState = {
  name: "",
  timezone: "Asia/Ho_Chi_Minh",
  currency: "VND",
  weeklyOffDays: [0],
};

interface DepartmentFormState {
  name: string;
  code: string;
}

const EMPTY_DEPARTMENT_FORM: DepartmentFormState = { name: "", code: "" };

export default function BranchesPage() {
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [branchModal, setBranchModal] = useState<{ mode: "create" | "edit"; branch?: Branch } | null>(null);
  const [branchForm, setBranchForm] = useState<BranchFormState>(EMPTY_BRANCH_FORM);
  const [branchSaving, setBranchSaving] = useState(false);
  const [branchError, setBranchError] = useState("");

  const [deptModal, setDeptModal] = useState<{ mode: "create" | "edit"; department?: Department } | null>(null);
  const [deptForm, setDeptForm] = useState<DepartmentFormState>(EMPTY_DEPARTMENT_FORM);
  const [deptSaving, setDeptSaving] = useState(false);
  const [deptError, setDeptError] = useState("");

  const [branchesState, reloadBranches] = useAsyncData((signal) => fetchBranches(signal), []);

  const effectiveBranchId =
    selectedBranchId ?? (branchesState.status === "success" ? (branchesState.data[0]?.id ?? null) : null);

  const [branchDetailState, reloadBranchDetail] = useAsyncData(
    (signal) => (effectiveBranchId ? fetchBranch(effectiveBranchId, signal) : Promise.resolve(null)),
    [effectiveBranchId],
  );

  const openCreateBranch = () => {
    setBranchForm(EMPTY_BRANCH_FORM);
    setBranchError("");
    setBranchModal({ mode: "create" });
  };

  const openEditBranch = (branch: Branch) => {
    setBranchForm({
      name: branch.name,
      timezone: branch.timezone,
      currency: branch.currency,
      weeklyOffDays: branch.weeklyOffDays ?? [],
    });
    setBranchError("");
    setBranchModal({ mode: "edit", branch });
  };

  const submitBranch = () => {
    if (!branchForm.name.trim()) {
      setBranchError("Tên chi nhánh không được để trống");
      return;
    }
    setBranchSaving(true);
    setBranchError("");
    const payload = {
      name: branchForm.name.trim(),
      timezone: branchForm.timezone.trim() || undefined,
      currency: branchForm.currency.trim() || undefined,
      weeklyOffDays: branchForm.weeklyOffDays,
    };
    const request =
      branchModal?.mode === "edit" && branchModal.branch
        ? updateBranch(branchModal.branch.id, payload)
        : createBranch(payload);

    request
      .then((branch) => {
        setBranchModal(null);
        reloadBranches();
        if (branchModal?.mode === "create") setSelectedBranchId(branch.id);
      })
      .catch((error: unknown) => {
        setBranchError(error instanceof ApiError ? error.message : "Không thể lưu chi nhánh.");
      })
      .finally(() => setBranchSaving(false));
  };

  const handleDeleteBranch = (branch: Branch) => {
    if (!window.confirm(`Xoá chi nhánh "${branch.name}"? Hành động này không thể hoàn tác.`)) return;
    deleteBranch(branch.id)
      .then(() => {
        if (selectedBranchId === branch.id) setSelectedBranchId(null);
        reloadBranches();
      })
      .catch((error: unknown) => {
        window.alert(error instanceof ApiError ? error.message : "Không thể xoá chi nhánh.");
      });
  };

  const openCreateDept = () => {
    setDeptForm(EMPTY_DEPARTMENT_FORM);
    setDeptError("");
    setDeptModal({ mode: "create" });
  };

  const openEditDept = (department: Department) => {
    setDeptForm({ name: department.name, code: department.code });
    setDeptError("");
    setDeptModal({ mode: "edit", department });
  };

  const submitDept = () => {
    if (!effectiveBranchId) return;
    if (!deptForm.name.trim() || !deptForm.code.trim()) {
      setDeptError("Tên và mã phòng ban không được để trống");
      return;
    }
    setDeptSaving(true);
    setDeptError("");
    const payload = { name: deptForm.name.trim(), code: deptForm.code.trim() };
    const request =
      deptModal?.mode === "edit" && deptModal.department
        ? updateDepartment(effectiveBranchId, deptModal.department.id, payload)
        : createDepartment(effectiveBranchId, payload);

    request
      .then(() => {
        setDeptModal(null);
        reloadBranchDetail();
      })
      .catch((error: unknown) => {
        setDeptError(error instanceof ApiError ? error.message : "Không thể lưu phòng ban.");
      })
      .finally(() => setDeptSaving(false));
  };

  const handleDeleteDept = (department: Department) => {
    if (!effectiveBranchId) return;
    if (!window.confirm(`Xoá phòng ban "${department.name}"?`)) return;
    deleteDepartment(effectiveBranchId, department.id)
      .then(() => reloadBranchDetail())
      .catch((error: unknown) => {
        window.alert(error instanceof ApiError ? error.message : "Không thể xoá phòng ban.");
      });
  };

  return (
    <AppShell
      activeKey="branches"
      title="Chi nhánh & Phòng ban"
      subtitle={
        branchesState.status === "success" ? `${branchesState.data.length} chi nhánh` : undefined
      }
      actions={
        <button className="btn btn-primary btn-sm" type="button" onClick={openCreateBranch}>
          <PlusOutlined />
          Thêm chi nhánh
        </button>
      }
    >
      {branchesState.status === "error" ? (
        <div className="card empty-state">
          <WarningOutlined style={{ fontSize: 28, color: "var(--color-danger)" }} />
          <p>{branchesState.message}</p>
          <button className="btn btn-outline btn-sm mt-2" type="button" onClick={reloadBranches}>
            <ReloadOutlined />
            Thử lại
          </button>
        </div>
      ) : (
        <div className="panel-grid">
          <div className="card" style={{ padding: 0 }}>
            <div className="panel-header">
              <h2>Danh sách chi nhánh</h2>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tên chi nhánh</th>
                    <th>Múi giờ</th>
                    <th>Tiền tệ</th>
                    <th>Ngày nghỉ tuần</th>
                    <th>Phòng ban</th>
                    <th style={{ textAlign: "right" }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {branchesState.status === "loading"
                    ? Array.from({ length: 3 }).map((_, index) => (
                        <tr key={index}>
                          <td colSpan={6}>
                            <div className="skeleton" style={{ height: 20 }} />
                          </td>
                        </tr>
                      ))
                    : branchesState.status === "success"
                      ? branchesState.data.map((branch) => (
                          <tr
                            key={branch.id}
                            onClick={() => setSelectedBranchId(branch.id)}
                            style={{
                              cursor: "pointer",
                              backgroundColor:
                                branch.id === effectiveBranchId ? "var(--color-surface-hover)" : undefined,
                            }}
                          >
                            <td>
                              <strong>{branch.name}</strong>
                            </td>
                            <td className="text-xs text-muted">{branch.timezone}</td>
                            <td className="text-xs text-muted">{branch.currency}</td>
                            <td className="text-xs text-muted">
                              {(branch.weeklyOffDays ?? []).map((d) => WEEKDAY_LABEL[d]).join(", ") || "—"}
                            </td>
                            <td className="text-xs text-muted">{branch._count?.departments ?? "—"}</td>
                            <td style={{ textAlign: "right" }}>
                              <div className="flex items-center gap-2" style={{ justifyContent: "flex-end" }}>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openEditBranch(branch);
                                  }}
                                >
                                  <EditOutlined />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleDeleteBranch(branch);
                                  }}
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
              {branchesState.status === "success" && branchesState.data.length === 0 ? (
                <div className="table-empty">Chưa có chi nhánh nào. Hãy tạo chi nhánh đầu tiên.</div>
              ) : null}
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="panel-header">
              <h2>
                <ApartmentOutlined /> Phòng ban
              </h2>
              {effectiveBranchId ? (
                <button className="btn btn-outline btn-sm" type="button" onClick={openCreateDept}>
                  <PlusOutlined />
                  Thêm
                </button>
              ) : null}
            </div>
            <div className="panel-body">
              {!effectiveBranchId ? (
                <div className="table-empty">Chọn một chi nhánh để xem phòng ban.</div>
              ) : branchDetailState.status === "loading" ? (
                <div className="skeleton" style={{ height: 120, margin: 16 }} />
              ) : branchDetailState.status === "error" ? (
                <div className="table-empty">{branchDetailState.message}</div>
              ) : branchDetailState.status === "success" && branchDetailState.data ? (
                branchDetailState.data.departments.length === 0 ? (
                  <div className="table-empty">Chi nhánh này chưa có phòng ban.</div>
                ) : (
                  <div className="flex flex-col gap-2" style={{ padding: 8 }}>
                    {branchDetailState.data.departments.map((dept) => (
                      <div
                        key={dept.id}
                        className="flex items-center justify-between"
                        style={{ padding: "10px 12px", borderRadius: "var(--radius-md)" }}
                      >
                        <div className="cell-copy">
                          <strong>{dept.name}</strong>
                          <small>{dept.code}</small>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => openEditDept(dept)}
                          >
                            <EditOutlined />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDeleteDept(dept)}
                          >
                            <DeleteOutlined style={{ color: "var(--color-danger)" }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : null}
            </div>
          </div>
        </div>
      )}

      {branchModal ? (
        <Modal
          title={branchModal.mode === "create" ? "Thêm chi nhánh" : `Sửa chi nhánh: ${branchModal.branch?.name}`}
          onClose={() => setBranchModal(null)}
          footer={
            <>
              <button className="btn btn-outline btn-sm" type="button" onClick={() => setBranchModal(null)}>
                Huỷ
              </button>
              <button className="btn btn-primary btn-sm" type="button" disabled={branchSaving} onClick={submitBranch}>
                {branchSaving ? "Đang lưu..." : "Lưu"}
              </button>
            </>
          }
        >
          {branchError ? (
            <div className="alert alert-danger">
              <WarningOutlined />
              <span>{branchError}</span>
            </div>
          ) : null}
          <div className="form-group">
            <label className="label">Tên chi nhánh</label>
            <input
              className="input"
              style={{ paddingInline: 12 }}
              value={branchForm.name}
              onChange={(event) => setBranchForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Chi nhánh Quận 1"
            />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="label">Múi giờ</label>
              <input
                className="input"
                style={{ paddingInline: 12 }}
                value={branchForm.timezone}
                onChange={(event) => setBranchForm((prev) => ({ ...prev, timezone: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="label">Đơn vị tiền tệ</label>
              <input
                className="input"
                style={{ paddingInline: 12 }}
                value={branchForm.currency}
                onChange={(event) => setBranchForm((prev) => ({ ...prev, currency: event.target.value }))}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Ngày nghỉ cố định trong tuần</label>
            <div className="weekday-picker">
              {WEEKDAYS.map((day) => {
                const active = branchForm.weeklyOffDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    className={`chip${active ? " is-active" : ""}`}
                    onClick={() =>
                      setBranchForm((prev) => ({
                        ...prev,
                        weeklyOffDays: active
                          ? prev.weeklyOffDays.filter((d) => d !== day)
                          : [...prev.weeklyOffDays, day].sort(),
                      }))
                    }
                  >
                    {WEEKDAY_LABEL[day]}
                  </button>
                );
              })}
            </div>
          </div>
        </Modal>
      ) : null}

      {deptModal ? (
        <Modal
          title={deptModal.mode === "create" ? "Thêm phòng ban" : `Sửa phòng ban: ${deptModal.department?.name}`}
          onClose={() => setDeptModal(null)}
          footer={
            <>
              <button className="btn btn-outline btn-sm" type="button" onClick={() => setDeptModal(null)}>
                Huỷ
              </button>
              <button className="btn btn-primary btn-sm" type="button" disabled={deptSaving} onClick={submitDept}>
                {deptSaving ? "Đang lưu..." : "Lưu"}
              </button>
            </>
          }
        >
          {deptError ? (
            <div className="alert alert-danger">
              <WarningOutlined />
              <span>{deptError}</span>
            </div>
          ) : null}
          <div className="form-group">
            <label className="label">Tên phòng ban</label>
            <input
              className="input"
              style={{ paddingInline: 12 }}
              value={deptForm.name}
              onChange={(event) => setDeptForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Bếp"
            />
          </div>
          <div className="form-group">
            <label className="label">Mã phòng ban</label>
            <input
              className="input"
              style={{ paddingInline: 12 }}
              value={deptForm.code}
              onChange={(event) => setDeptForm((prev) => ({ ...prev, code: event.target.value }))}
              placeholder="KITCHEN"
            />
          </div>
        </Modal>
      ) : null}
    </AppShell>
  );
}
