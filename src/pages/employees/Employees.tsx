import { useEffect, useState } from "react";
import {
  PlusOutlined,
  WarningOutlined,
  ReloadOutlined,
  EditOutlined,
  SwapOutlined,
  DollarOutlined,
  IdcardOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { AppShell } from "../../components/layout/AppShell";
import { ChipFilter } from "../../components/filters/ChipFilter";
import { Modal } from "../../components/ui/Modal";
import { useAsyncData } from "../../lib/useAsyncData";
import { ApiError } from "../../lib/httpClient";
import { initialsOf } from "../../lib/textUtils";
import { formatVnd } from "../../lib/money";
import { fetchBranches, fetchDepartments } from "../../features/organization/organization.api";
import type { Department } from "../../features/organization/organization.types";
import { createUser } from "../../features/users/users.api";
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  softDeleteEmployee,
  transferEmployee,
  fetchCompensationHistory,
  createCompensation,
} from "./employees.api";
import {
  EMPLOYEE_STATUS_LABEL,
  EMPLOYEE_STATUS_TRANSITIONS,
  PAY_BASIS_LABEL,
  CONTRACT_TYPE_LABEL,
} from "./employees.types";
import type { CompensationRecord, ContractType, Employee, EmployeeStatus, PayBasis } from "./employees.types";

const PAGE_SIZE = 10;
const ALL = "Tất cả";

function DepartmentSelect({
  branchId,
  value,
  onChange,
  allowNone = true,
}: {
  branchId: string | null;
  value: string;
  onChange: (id: string) => void;
  allowNone?: boolean;
}) {
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    if (!branchId) {
      setDepartments([]);
      return;
    }
    const controller = new AbortController();
    fetchDepartments(branchId, controller.signal)
      .then(setDepartments)
      .catch(() => setDepartments([]));
    return () => controller.abort();
  }, [branchId]);

  return (
    <select
      className="input"
      style={{ paddingInline: 12 }}
      value={value}
      disabled={!branchId}
      onChange={(event) => onChange(event.target.value)}
    >
      {allowNone ? <option value="">— Không thuộc phòng ban —</option> : null}
      {departments.map((dept) => (
        <option key={dept.id} value={dept.id}>
          {dept.name}
        </option>
      ))}
    </select>
  );
}

export default function EmployeesPage() {
  const [branchFilter, setBranchFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | typeof ALL>(ALL);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const [branchesState] = useAsyncData((signal) => fetchBranches(signal), []);
  const branches = branchesState.status === "success" ? branchesState.data : [];
  const branchId = branchFilter === ALL ? undefined : branches.find((b) => b.name === branchFilter)?.id;
  const status = statusFilter === ALL ? undefined : statusFilter;

  const [state, reload] = useAsyncData(
    (signal) => fetchEmployees({ branchId, status, search: search || undefined, page, pageSize: PAGE_SIZE }, signal),
    [branchId, status, search, page],
  );

  const employees = state.status === "success" ? state.data.data : [];
  const meta = state.status === "success" ? state.data.meta : null;
  const totalPages = meta ? Math.max(1, meta.totalPages) : 1;

  // ---- Create employee ----
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    employeeCode: "",
    fullName: "",
    branchId: "",
    departmentId: "",
    status: "probation" as "active" | "probation",
  });
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState("");

  const openCreate = () => {
    setCreateForm({
      employeeCode: "",
      fullName: "",
      branchId: branches[0]?.id ?? "",
      departmentId: "",
      status: "probation",
    });
    setCreateError("");
    setCreateOpen(true);
  };

  const submitCreate = () => {
    if (!createForm.employeeCode.trim() || !createForm.fullName.trim() || !createForm.branchId) {
      setCreateError("Vui lòng nhập đủ mã NV, họ tên và chi nhánh");
      return;
    }
    setCreateSaving(true);
    setCreateError("");
    createEmployee({
      employeeCode: createForm.employeeCode.trim(),
      fullName: createForm.fullName.trim(),
      branchId: createForm.branchId,
      departmentId: createForm.departmentId || undefined,
      status: createForm.status,
    })
      .then(() => {
        setCreateOpen(false);
        reload();
      })
      .catch((error: unknown) => {
        setCreateError(error instanceof ApiError ? error.message : "Không thể tạo nhân viên.");
      })
      .finally(() => setCreateSaving(false));
  };

  // ---- Edit employee ----
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    departmentId: "",
    status: "" as EmployeeStatus,
    terminationDate: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const openEdit = (employee: Employee) => {
    setEditForm({
      fullName: employee.fullName,
      departmentId: employee.departmentId ?? "",
      status: employee.status,
      terminationDate: "",
    });
    setEditError("");
    setEditEmployee(employee);
  };

  const submitEdit = () => {
    if (!editEmployee) return;
    if (!editForm.fullName.trim()) {
      setEditError("Họ tên không được để trống");
      return;
    }
    if (editForm.status === "terminated" && !editForm.terminationDate) {
      setEditError("Vui lòng chọn ngày nghỉ việc");
      return;
    }
    setEditSaving(true);
    setEditError("");
    updateEmployee(editEmployee.id, {
      fullName: editForm.fullName.trim(),
      departmentId: editForm.departmentId || null,
      status: editForm.status !== editEmployee.status ? editForm.status : undefined,
      terminationDate: editForm.status === "terminated" ? editForm.terminationDate : undefined,
    })
      .then(() => {
        setEditEmployee(null);
        reload();
      })
      .catch((error: unknown) => {
        setEditError(error instanceof ApiError ? error.message : "Không thể cập nhật nhân viên.");
      })
      .finally(() => setEditSaving(false));
  };

  // ---- Transfer employee ----
  const [transferEmp, setTransferEmp] = useState<Employee | null>(null);
  const [transferForm, setTransferForm] = useState({ targetBranchId: "", targetDepartmentId: "" });
  const [transferSaving, setTransferSaving] = useState(false);
  const [transferError, setTransferError] = useState("");

  const openTransfer = (employee: Employee) => {
    setTransferForm({ targetBranchId: "", targetDepartmentId: "" });
    setTransferError("");
    setTransferEmp(employee);
  };

  const submitTransfer = () => {
    if (!transferEmp) return;
    if (!transferForm.targetBranchId) {
      setTransferError("Vui lòng chọn chi nhánh đích");
      return;
    }
    setTransferSaving(true);
    setTransferError("");
    transferEmployee(transferEmp.id, {
      targetBranchId: transferForm.targetBranchId,
      targetDepartmentId: transferForm.targetDepartmentId || undefined,
    })
      .then(() => {
        setTransferEmp(null);
        reload();
      })
      .catch((error: unknown) => {
        setTransferError(error instanceof ApiError ? error.message : "Không thể luân chuyển nhân viên.");
      })
      .finally(() => setTransferSaving(false));
  };

  // ---- Compensation history ----
  const [compEmp, setCompEmp] = useState<Employee | null>(null);
  const [compHistory, setCompHistory] = useState<CompensationRecord[] | null>(null);
  const [compError, setCompError] = useState("");
  const [compForm, setCompForm] = useState({
    contractType: "full_time" as ContractType,
    payBasis: "monthly" as PayBasis,
    rate: "",
    effectiveFrom: "",
  });
  const [compSaving, setCompSaving] = useState(false);

  const openCompensation = (employee: Employee) => {
    setCompEmp(employee);
    setCompHistory(null);
    setCompError("");
    setCompForm({ contractType: "full_time", payBasis: "monthly", rate: "", effectiveFrom: "" });
    fetchCompensationHistory(employee.id)
      .then(setCompHistory)
      .catch((error: unknown) => {
        setCompError(error instanceof ApiError ? error.message : "Không thể tải lịch sử lương.");
        setCompHistory([]);
      });
  };

  const submitCompensation = () => {
    if (!compEmp) return;
    const rate = Number(compForm.rate);
    if (Number.isNaN(rate) || rate <= 0 || !compForm.effectiveFrom) {
      setCompError("Vui lòng nhập mức lương hợp lệ và ngày hiệu lực");
      return;
    }
    setCompSaving(true);
    setCompError("");
    createCompensation(compEmp.id, {
      contractType: compForm.contractType,
      payBasis: compForm.payBasis,
      rate,
      effectiveFrom: compForm.effectiveFrom,
    })
      .then((record) => {
        setCompHistory((prev) => [record, ...(prev ?? [])]);
        setCompForm({ contractType: "full_time", payBasis: "monthly", rate: "", effectiveFrom: "" });
      })
      .catch((error: unknown) => {
        setCompError(error instanceof ApiError ? error.message : "Không thể thêm mức lương.");
      })
      .finally(() => setCompSaving(false));
  };

  // ---- Create login account ----
  const [accountEmp, setAccountEmp] = useState<Employee | null>(null);
  const [accountForm, setAccountForm] = useState({ email: "", password: "", fullName: "" });
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [accountResult, setAccountResult] = useState<string | null>(null);

  const openAccount = (employee: Employee) => {
    setAccountForm({ email: "", password: "", fullName: employee.fullName });
    setAccountError("");
    setAccountResult(null);
    setAccountEmp(employee);
  };

  const submitAccount = () => {
    if (!accountEmp) return;
    if (!accountForm.email.trim() || !accountForm.password || !accountForm.fullName.trim()) {
      setAccountError("Vui lòng nhập đủ email, mật khẩu và họ tên");
      return;
    }
    setAccountSaving(true);
    setAccountError("");
    createUser({
      email: accountForm.email.trim(),
      password: accountForm.password,
      fullName: accountForm.fullName.trim(),
      employeeId: accountEmp.id,
    })
      .then((user) => {
        setAccountResult(user.id);
      })
      .catch((error: unknown) => {
        setAccountError(error instanceof ApiError ? error.message : "Không thể tạo tài khoản.");
      })
      .finally(() => setAccountSaving(false));
  };

  // ---- Delete ----
  const handleDelete = (employee: Employee) => {
    if (!window.confirm(`Vô hiệu hoá nhân viên "${employee.fullName}"? Tài khoản liên kết (nếu có) cũng sẽ bị khoá.`))
      return;
    softDeleteEmployee(employee.id)
      .then(() => reload())
      .catch((error: unknown) => {
        window.alert(error instanceof ApiError ? error.message : "Không thể xoá nhân viên.");
      });
  };

  return (
    <AppShell
      activeKey="employees"
      title="Danh sách nhân viên"
      subtitle={meta ? `Hiển thị ${employees.length} / ${meta.totalItems} nhân viên` : undefined}
      actions={
        <button className="btn btn-primary btn-sm" type="button" onClick={openCreate}>
          <PlusOutlined />
          Thêm nhân viên
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
              options={[ALL, ...branches.map((b) => b.name)]}
              value={branchFilter}
              onChange={(value) => {
                setBranchFilter(value);
                setPage(1);
              }}
            />
            <ChipFilter
              label="Trạng thái"
              options={[ALL, ...Object.keys(EMPLOYEE_STATUS_LABEL)]}
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value as EmployeeStatus | typeof ALL);
                setPage(1);
              }}
            />
            <div className="filter-spacer" style={{ minWidth: 220 }}>
              <input
                className="input"
                style={{ paddingInline: 12, height: 36 }}
                placeholder="Tìm theo mã NV hoặc tên..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
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
                  <th>Trạng thái</th>
                  <th style={{ textAlign: "right" }}>Hành động</th>
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
                    ? employees.map((employee) => {
                        const statusMeta = EMPLOYEE_STATUS_LABEL[employee.status];
                        return (
                          <tr key={employee.id}>
                            <td>
                              <div className="avatar">{initialsOf(employee.fullName)}</div>
                            </td>
                            <td>
                              <div className="cell-copy">
                                <strong>{employee.fullName}</strong>
                                <small>{employee.department?.name ?? "Chưa có phòng ban"}</small>
                              </div>
                            </td>
                            <td>{employee.employeeCode}</td>
                            <td>{employee.department?.name ?? "—"}</td>
                            <td>{employee.branch.name}</td>
                            <td>
                              <span className={`badge badge-${statusMeta.tone}`}>{statusMeta.label}</span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <div className="flex items-center gap-1" style={{ justifyContent: "flex-end" }}>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  title="Sửa thông tin"
                                  onClick={() => openEdit(employee)}
                                >
                                  <EditOutlined />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  title="Luân chuyển chi nhánh"
                                  onClick={() => openTransfer(employee)}
                                >
                                  <SwapOutlined />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  title="Lịch sử lương"
                                  onClick={() => openCompensation(employee)}
                                >
                                  <DollarOutlined />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  title="Tạo tài khoản đăng nhập"
                                  onClick={() => openAccount(employee)}
                                >
                                  <IdcardOutlined />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  title="Vô hiệu hoá"
                                  onClick={() => handleDelete(employee)}
                                >
                                  <DeleteOutlined style={{ color: "var(--color-danger)" }} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    : null}
              </tbody>
            </table>
            {state.status === "success" && employees.length === 0 ? (
              <div className="table-empty">Không có nhân viên nào khớp bộ lọc hiện tại.</div>
            ) : null}
          </div>

          {meta ? (
            <div className="table-foot">
              <span>
                Hiển thị {employees.length} / {meta.totalItems} nhân viên
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

      {createOpen ? (
        <Modal
          title="Thêm nhân viên"
          onClose={() => setCreateOpen(false)}
          footer={
            <>
              <button className="btn btn-outline btn-sm" type="button" onClick={() => setCreateOpen(false)}>
                Huỷ
              </button>
              <button className="btn btn-primary btn-sm" type="button" disabled={createSaving} onClick={submitCreate}>
                {createSaving ? "Đang lưu..." : "Tạo nhân viên"}
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
              <label className="label">Mã nhân viên</label>
              <input
                className="input"
                style={{ paddingInline: 12 }}
                value={createForm.employeeCode}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, employeeCode: event.target.value }))}
                placeholder="EMP-001"
              />
            </div>
            <div className="form-group">
              <label className="label">Họ và tên</label>
              <input
                className="input"
                style={{ paddingInline: 12 }}
                value={createForm.fullName}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, fullName: event.target.value }))}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div className="form-group">
              <label className="label">Chi nhánh</label>
              <select
                className="input"
                style={{ paddingInline: 12 }}
                value={createForm.branchId}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, branchId: event.target.value, departmentId: "" }))
                }
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Phòng ban</label>
              <DepartmentSelect
                branchId={createForm.branchId || null}
                value={createForm.departmentId}
                onChange={(id) => setCreateForm((prev) => ({ ...prev, departmentId: id }))}
              />
            </div>
            <div className="form-group form-field-full">
              <label className="label">Trạng thái khởi tạo</label>
              <select
                className="input"
                style={{ paddingInline: 12 }}
                value={createForm.status}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, status: event.target.value as "active" | "probation" }))
                }
              >
                <option value="probation">Thử việc</option>
                <option value="active">Đang làm việc</option>
              </select>
            </div>
          </div>
        </Modal>
      ) : null}

      {editEmployee ? (
        <Modal
          title={`Sửa thông tin: ${editEmployee.fullName}`}
          onClose={() => setEditEmployee(null)}
          footer={
            <>
              <button className="btn btn-outline btn-sm" type="button" onClick={() => setEditEmployee(null)}>
                Huỷ
              </button>
              <button className="btn btn-primary btn-sm" type="button" disabled={editSaving} onClick={submitEdit}>
                {editSaving ? "Đang lưu..." : "Lưu"}
              </button>
            </>
          }
        >
          {editError ? (
            <div className="alert alert-danger">
              <WarningOutlined />
              <span>{editError}</span>
            </div>
          ) : null}
          <div className="form-group">
            <label className="label">Họ và tên</label>
            <input
              className="input"
              style={{ paddingInline: 12 }}
              value={editForm.fullName}
              onChange={(event) => setEditForm((prev) => ({ ...prev, fullName: event.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="label">Phòng ban ({editEmployee.branch.name})</label>
            <DepartmentSelect
              branchId={editEmployee.branchId}
              value={editForm.departmentId}
              onChange={(id) => setEditForm((prev) => ({ ...prev, departmentId: id }))}
            />
          </div>
          <div className="form-group">
            <label className="label">Trạng thái</label>
            <select
              className="input"
              style={{ paddingInline: 12 }}
              value={editForm.status}
              onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value as EmployeeStatus }))}
            >
              <option value={editEmployee.status}>{EMPLOYEE_STATUS_LABEL[editEmployee.status].label} (hiện tại)</option>
              {EMPLOYEE_STATUS_TRANSITIONS[editEmployee.status].map((s) => (
                <option key={s} value={s}>
                  {EMPLOYEE_STATUS_LABEL[s].label}
                </option>
              ))}
            </select>
          </div>
          {editForm.status === "terminated" ? (
            <div className="form-group">
              <label className="label">Ngày nghỉ việc</label>
              <input
                className="input"
                style={{ paddingInline: 12 }}
                type="date"
                value={editForm.terminationDate}
                onChange={(event) => setEditForm((prev) => ({ ...prev, terminationDate: event.target.value }))}
              />
            </div>
          ) : null}
        </Modal>
      ) : null}

      {transferEmp ? (
        <Modal
          title={`Luân chuyển: ${transferEmp.fullName}`}
          subtitle={`Chi nhánh hiện tại: ${transferEmp.branch.name}`}
          onClose={() => setTransferEmp(null)}
          footer={
            <>
              <button className="btn btn-outline btn-sm" type="button" onClick={() => setTransferEmp(null)}>
                Huỷ
              </button>
              <button
                className="btn btn-primary btn-sm"
                type="button"
                disabled={transferSaving}
                onClick={submitTransfer}
              >
                {transferSaving ? "Đang chuyển..." : "Luân chuyển"}
              </button>
            </>
          }
        >
          {transferError ? (
            <div className="alert alert-danger">
              <WarningOutlined />
              <span>{transferError}</span>
            </div>
          ) : null}
          <div className="form-group">
            <label className="label">Chi nhánh đích</label>
            <select
              className="input"
              style={{ paddingInline: 12 }}
              value={transferForm.targetBranchId}
              onChange={(event) =>
                setTransferForm({ targetBranchId: event.target.value, targetDepartmentId: "" })
              }
            >
              <option value="">— Chọn chi nhánh —</option>
              {branches
                .filter((b) => b.id !== transferEmp.branchId)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Phòng ban tại chi nhánh đích</label>
            <DepartmentSelect
              branchId={transferForm.targetBranchId || null}
              value={transferForm.targetDepartmentId}
              onChange={(id) => setTransferForm((prev) => ({ ...prev, targetDepartmentId: id }))}
            />
          </div>
        </Modal>
      ) : null}

      {compEmp ? (
        <Modal
          title={`Lịch sử lương: ${compEmp.fullName}`}
          onClose={() => setCompEmp(null)}
          wide
          footer={
            <button className="btn btn-outline btn-sm" type="button" onClick={() => setCompEmp(null)}>
              Đóng
            </button>
          }
        >
          {compError ? (
            <div className="alert alert-danger">
              <WarningOutlined />
              <span>{compError}</span>
            </div>
          ) : null}

          {compHistory === null ? (
            <div className="skeleton" style={{ height: 60 }} />
          ) : compHistory.length === 0 ? (
            <p className="text-sm text-muted">Chưa có mức lương nào được ghi nhận.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Loại HĐ</th>
                    <th>Đơn vị tính</th>
                    <th>Mức lương</th>
                    <th>Hiệu lực từ</th>
                    <th>Đến</th>
                  </tr>
                </thead>
                <tbody>
                  {compHistory.map((record) => (
                    <tr key={record.id}>
                      <td>{CONTRACT_TYPE_LABEL[record.contractType]}</td>
                      <td>{PAY_BASIS_LABEL[record.payBasis]}</td>
                      <td>{formatVnd(Number(record.rate))}</td>
                      <td>{record.effectiveFrom.slice(0, 10)}</td>
                      <td>{record.effectiveTo ? record.effectiveTo.slice(0, 10) : "Hiện hành"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="divider" />
          <p className="text-sm" style={{ fontWeight: 500 }}>
            Thêm mức lương mới
          </p>
          <div className="form-grid">
            <div className="form-group">
              <label className="label">Loại hợp đồng</label>
              <select
                className="input"
                style={{ paddingInline: 12 }}
                value={compForm.contractType}
                onChange={(event) =>
                  setCompForm((prev) => ({ ...prev, contractType: event.target.value as ContractType }))
                }
              >
                {Object.entries(CONTRACT_TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Đơn vị tính lương</label>
              <select
                className="input"
                style={{ paddingInline: 12 }}
                value={compForm.payBasis}
                onChange={(event) => setCompForm((prev) => ({ ...prev, payBasis: event.target.value as PayBasis }))}
              >
                {Object.entries(PAY_BASIS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Mức lương (VNĐ)</label>
              <input
                className="input"
                style={{ paddingInline: 12 }}
                type="number"
                min="0"
                value={compForm.rate}
                onChange={(event) => setCompForm((prev) => ({ ...prev, rate: event.target.value }))}
                placeholder="15000000"
              />
            </div>
            <div className="form-group">
              <label className="label">Hiệu lực từ ngày</label>
              <input
                className="input"
                style={{ paddingInline: 12 }}
                type="date"
                value={compForm.effectiveFrom}
                onChange={(event) => setCompForm((prev) => ({ ...prev, effectiveFrom: event.target.value }))}
              />
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            type="button"
            disabled={compSaving}
            onClick={submitCompensation}
            style={{ alignSelf: "flex-start" }}
          >
            {compSaving ? "Đang lưu..." : "Thêm mức lương"}
          </button>
        </Modal>
      ) : null}

      {accountEmp ? (
        <Modal
          title={`Tạo tài khoản đăng nhập: ${accountEmp.fullName}`}
          onClose={() => setAccountEmp(null)}
          footer={
            accountResult ? (
              <button className="btn btn-primary btn-sm" type="button" onClick={() => setAccountEmp(null)}>
                Đóng
              </button>
            ) : (
              <>
                <button className="btn btn-outline btn-sm" type="button" onClick={() => setAccountEmp(null)}>
                  Huỷ
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  type="button"
                  disabled={accountSaving}
                  onClick={submitAccount}
                >
                  {accountSaving ? "Đang tạo..." : "Tạo tài khoản"}
                </button>
              </>
            )
          }
        >
          {accountResult ? (
            <div className="alert alert-success">
              <span>
                Đã tạo tài khoản thành công. User ID: <code>{accountResult}</code> — hãy lưu lại ID này để phân
                quyền tại trang "Tài khoản &amp; Phân quyền" (hệ thống hiện chưa có danh sách tra cứu tài khoản).
              </span>
            </div>
          ) : (
            <>
              {accountError ? (
                <div className="alert alert-danger">
                  <WarningOutlined />
                  <span>{accountError}</span>
                </div>
              ) : null}
              <div className="form-group">
                <label className="label">Email đăng nhập</label>
                <input
                  className="input"
                  style={{ paddingInline: 12 }}
                  type="email"
                  value={accountForm.email}
                  onChange={(event) => setAccountForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="nhanvien@abc.com"
                />
              </div>
              <div className="form-group">
                <label className="label">Mật khẩu tạm thời</label>
                <input
                  className="input"
                  style={{ paddingInline: 12 }}
                  type="text"
                  value={accountForm.password}
                  onChange={(event) => setAccountForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="Tối thiểu 8 ký tự, có hoa/thường/số"
                />
              </div>
              <div className="form-group">
                <label className="label">Họ và tên hiển thị</label>
                <input
                  className="input"
                  style={{ paddingInline: 12 }}
                  value={accountForm.fullName}
                  onChange={(event) => setAccountForm((prev) => ({ ...prev, fullName: event.target.value }))}
                />
              </div>
            </>
          )}
        </Modal>
      ) : null}
    </AppShell>
  );
}
