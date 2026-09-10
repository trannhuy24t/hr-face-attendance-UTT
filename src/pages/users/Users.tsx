import { useState } from "react";
import { PlusOutlined, WarningOutlined, DeleteOutlined, SearchOutlined, SaveOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { AppShell } from "../../components/layout/AppShell";
import { useAsyncData } from "../../lib/useAsyncData";
import { ApiError } from "../../lib/httpClient";
import { ROLE_LABEL } from "../../lib/roles";
import { fetchBranches } from "../../features/organization/organization.api";
import { createUser, fetchUserRoles, updateUserRoles, softDeleteUser } from "../../features/users/users.api";
import type { RoleAssignmentInput } from "../../features/users/users.api";
import type { BranchRole, UserRoleAssignment } from "../../features/users/users.types";

const TENANT_WIDE = "__tenant_wide__";
const ROLES: BranchRole[] = ["owner", "manager", "accountant", "staff"];

export default function UsersPage() {
  const [branchesState] = useAsyncData((signal) => fetchBranches(signal), []);
  const branches = branchesState.status === "success" ? branchesState.data : [];

  // ---- Create standalone account ----
  const [createForm, setCreateForm] = useState({ email: "", password: "", fullName: "" });
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);

  const submitCreate = () => {
    if (!createForm.email.trim() || !createForm.password || !createForm.fullName.trim()) {
      setCreateError("Vui lòng nhập đủ email, mật khẩu và họ tên");
      return;
    }
    setCreateSaving(true);
    setCreateError("");
    createUser({
      email: createForm.email.trim(),
      password: createForm.password,
      fullName: createForm.fullName.trim(),
    })
      .then((user) => {
        setCreatedId(user.id);
        setCreateForm({ email: "", password: "", fullName: "" });
        setLookupId(user.id);
        runLookup(user.id);
      })
      .catch((error: unknown) => {
        setCreateError(error instanceof ApiError ? error.message : "Không thể tạo tài khoản.");
      })
      .finally(() => setCreateSaving(false));
  };

  // ---- Lookup + role editor ----
  const [lookupId, setLookupId] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [roles, setRoles] = useState<UserRoleAssignment[] | null>(null);
  const [draftRoles, setDraftRoles] = useState<RoleAssignmentInput[]>([]);
  const [rolesSaving, setRolesSaving] = useState(false);
  const [rolesSaved, setRolesSaved] = useState(false);

  const runLookup = (userId: string) => {
    if (!userId.trim()) {
      setLookupError("Vui lòng nhập User ID");
      return;
    }
    setLookupError("");
    setRolesSaved(false);
    fetchUserRoles(userId.trim())
      .then((data) => {
        setRoles(data);
        setDraftRoles(data.map((r) => ({ branchId: r.branchId, role: r.role })));
      })
      .catch((error: unknown) => {
        setRoles(null);
        setLookupError(error instanceof ApiError ? error.message : "Không tìm thấy tài khoản.");
      });
  };

  const submitRoles = () => {
    if (!lookupId.trim() || draftRoles.length === 0) {
      setLookupError("Cần ít nhất 1 vai trò");
      return;
    }
    setRolesSaving(true);
    setLookupError("");
    updateUserRoles(lookupId.trim(), draftRoles)
      .then((data) => {
        setRoles(data);
        setDraftRoles(data.map((r) => ({ branchId: r.branchId, role: r.role })));
        setRolesSaved(true);
      })
      .catch((error: unknown) => {
        setLookupError(error instanceof ApiError ? error.message : "Không thể cập nhật phân quyền.");
      })
      .finally(() => setRolesSaving(false));
  };

  const handleDisable = () => {
    if (!lookupId.trim()) return;
    if (!window.confirm("Vô hiệu hoá tài khoản này? Mọi phiên đăng nhập sẽ bị thu hồi.")) return;
    softDeleteUser(lookupId.trim())
      .then(() => {
        setRoles(null);
        setDraftRoles([]);
        window.alert("Đã vô hiệu hoá tài khoản.");
      })
      .catch((error: unknown) => {
        window.alert(error instanceof ApiError ? error.message : "Không thể vô hiệu hoá tài khoản.");
      });
  };

  return (
    <AppShell
      activeKey="users"
      title="Tài khoản & Phân quyền"
      subtitle="Tạo tài khoản đăng nhập và quản lý vai trò theo chi nhánh"
    >
      <div className="panel-grid">
        <div className="card">
          <h2 className="text-sm" style={{ fontWeight: 500 }}>
            Tra cứu &amp; phân quyền tài khoản
          </h2>
          <p className="text-xs text-muted mt-1">
            Hệ thống hiện chưa có API liệt kê danh sách tài khoản — nhập User ID (lấy khi tạo tài khoản mới, hoặc
            từ hành động "Tạo tài khoản đăng nhập" ở trang Nhân viên) để tra cứu.
          </p>

          <div className="flex items-center gap-2 mt-4">
            <input
              className="input"
              style={{ paddingInline: 12 }}
              placeholder="User ID (UUID)"
              value={lookupId}
              onChange={(event) => setLookupId(event.target.value)}
            />
            <button className="btn btn-outline btn-sm" type="button" onClick={() => runLookup(lookupId)}>
              <SearchOutlined />
              Tra cứu
            </button>
          </div>

          {lookupError ? (
            <div className="alert alert-danger mt-4">
              <WarningOutlined />
              <span>{lookupError}</span>
            </div>
          ) : null}
          {rolesSaved ? (
            <div className="alert alert-success mt-4">
              <CheckCircleOutlined />
              <span>Đã cập nhật phân quyền. Các phiên đăng nhập cũ của tài khoản này đã bị đăng xuất.</span>
            </div>
          ) : null}

          {roles !== null ? (
            <div className="flex flex-col gap-3 mt-4">
              {draftRoles.map((role, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    className="input"
                    style={{ paddingInline: 12, flex: 1 }}
                    value={role.branchId ?? TENANT_WIDE}
                    onChange={(event) => {
                      const value = event.target.value === TENANT_WIDE ? null : event.target.value;
                      setDraftRoles((prev) => prev.map((r, i) => (i === index ? { ...r, branchId: value } : r)));
                    }}
                  >
                    <option value={TENANT_WIDE}>Toàn tenant (mọi chi nhánh)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="input"
                    style={{ paddingInline: 12, flex: 1 }}
                    value={role.role}
                    onChange={(event) => {
                      const value = event.target.value as BranchRole;
                      setDraftRoles((prev) => prev.map((r, i) => (i === index ? { ...r, role: value } : r)));
                    }}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setDraftRoles((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <DeleteOutlined style={{ color: "var(--color-danger)" }} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ alignSelf: "flex-start" }}
                onClick={() => setDraftRoles((prev) => [...prev, { branchId: null, role: "staff" }])}
              >
                <PlusOutlined />
                Thêm vai trò
              </button>

              <div className="flex items-center gap-2 mt-2">
                <button className="btn btn-primary btn-sm" type="button" disabled={rolesSaving} onClick={submitRoles}>
                  <SaveOutlined />
                  {rolesSaving ? "Đang lưu..." : "Lưu phân quyền"}
                </button>
                <button className="btn btn-outline btn-sm" type="button" onClick={handleDisable}>
                  Vô hiệu hoá tài khoản
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="card">
          <h2 className="text-sm" style={{ fontWeight: 500 }}>
            Tạo tài khoản mới
          </h2>
          <p className="text-xs text-muted mt-1">
            Dùng cho tài khoản quản trị không gắn với hồ sơ nhân viên cụ thể. Để tạo tài khoản đăng nhập cho một
            nhân viên, dùng hành động tương ứng ở trang Nhân viên.
          </p>

          {createError ? (
            <div className="alert alert-danger mt-4">
              <WarningOutlined />
              <span>{createError}</span>
            </div>
          ) : null}
          {createdId ? (
            <div className="alert alert-success mt-4">
              <CheckCircleOutlined />
              <span>
                Đã tạo tài khoản. User ID: <code>{createdId}</code>
              </span>
            </div>
          ) : null}

          <div className="flex flex-col gap-4 mt-4">
            <div className="form-group">
              <label className="label">Email</label>
              <input
                className="input"
                style={{ paddingInline: 12 }}
                type="email"
                value={createForm.email}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="admin@abc.com"
              />
            </div>
            <div className="form-group">
              <label className="label">Mật khẩu</label>
              <input
                className="input"
                style={{ paddingInline: 12 }}
                type="text"
                value={createForm.password}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Tối thiểu 8 ký tự, có hoa/thường/số"
              />
            </div>
            <div className="form-group">
              <label className="label">Họ và tên</label>
              <input
                className="input"
                style={{ paddingInline: 12 }}
                value={createForm.fullName}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, fullName: event.target.value }))}
              />
            </div>
            <button
              className="btn btn-primary btn-sm"
              type="button"
              disabled={createSaving}
              onClick={submitCreate}
              style={{ alignSelf: "flex-start" }}
            >
              <PlusOutlined />
              {createSaving ? "Đang tạo..." : "Tạo tài khoản"}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
