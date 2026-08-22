import { useState } from "react";
import { BellOutlined, SaveOutlined, WarningOutlined, ReloadOutlined } from "@ant-design/icons";
import { AppShell } from "../../components/layout/AppShell";
import { ChipFilter, ToggleChip } from "../../components/filters/ChipFilter";
import { useAsyncData } from "../../lib/useAsyncData";
import { initialsOf } from "../../lib/textUtils";
import { fetchBiometricStatus, fetchSettings } from "./settings.api";
import { BIOMETRIC_LABEL } from "./settings.types";

export default function SettingsPage() {
  const [tabKey, setTabKey] = useState<string | null>(null);
  const [toggleOverrides, setToggleOverrides] = useState<Record<string, boolean>>({});

  const [settingsState, reloadSettings] = useAsyncData((signal) => fetchSettings(signal), []);

  const [branch, setBranch] = useState("Tất cả");
  const [department, setDepartment] = useState("Tất cả");
  const [pendingOnly, setPendingOnly] = useState(false);
  const [bioState, reloadBio] = useAsyncData(
    (signal) => fetchBiometricStatus({ branch, department, pendingOnly }, signal),
    [branch, department, pendingOnly],
  );

  const tabs = settingsState.status === "success" ? settingsState.data.tabs : [];
  const activeTab = tabs.find((tab) => tab.key === tabKey) ?? tabs[0] ?? null;

  return (
    <AppShell
      activeKey="settings"
      title="Cài đặt hệ thống"
      subtitle={settingsState.status === "success" ? settingsState.data.companyMeta : undefined}
      actions={
        <>
          <button className="btn btn-outline btn-sm" type="button">
            Hoàn tác
          </button>
          <button className="btn btn-primary btn-sm" type="button">
            <SaveOutlined />
            Lưu thay đổi
          </button>
        </>
      }
    >
      {settingsState.status === "error" ? (
        <div className="card empty-state">
          <WarningOutlined style={{ fontSize: 28, color: "var(--color-danger)" }} />
          <p>{settingsState.message}</p>
          <button className="btn btn-outline btn-sm mt-2" type="button" onClick={reloadSettings}>
            <ReloadOutlined />
            Thử lại
          </button>
        </div>
      ) : (
        <div className="settings-grid">
          <div className="card side-tabs">
            {settingsState.status === "loading"
              ? Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="skeleton" style={{ height: 36 }} />
                ))
              : tabs.map((tab) => (
                  <div
                    key={tab.key}
                    className={`side-tab${tab.key === activeTab?.key ? " is-active" : ""}`}
                    onClick={() => setTabKey(tab.key)}
                  >
                    <span>{tab.label}</span>
                    <span className="side-tab-count">{tab.settings.length}</span>
                  </div>
                ))}
          </div>

          <div className="flex flex-col gap-4">
            {settingsState.status === "loading" ? (
              <div className="card">
                <div className="skeleton" style={{ height: 240 }} />
              </div>
            ) : activeTab ? (
              <div className="card settings-panel">
                <div>
                  <h2 className="text-sm" style={{ fontWeight: 500 }}>
                    {activeTab.label}
                  </h2>
                  <p className="text-xs text-muted mt-1">{activeTab.description}</p>
                </div>

                {activeTab.settings.map((setting) => {
                  const on = toggleOverrides[setting.key] ?? setting.on ?? false;
                  return (
                    <div key={setting.key} className="setting-row">
                      <div className="setting-copy">
                        <strong>{setting.label}</strong>
                        <small>{setting.hint}</small>
                      </div>
                      {setting.isToggle ? (
                        <div
                          className={`switch${on ? " is-on" : ""}`}
                          onClick={() =>
                            setToggleOverrides((prev) => ({ ...prev, [setting.key]: !on }))
                          }
                        >
                          <span className="switch-thumb" />
                        </div>
                      ) : (
                        <div className="setting-value">{setting.value}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card empty-state">Chưa có mục cài đặt nào để hiển thị.</div>
            )}

            <div className="card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm" style={{ fontWeight: 500 }}>
                    Đăng ký sinh trắc học theo nhân viên
                  </h2>
                  <p className="text-xs text-muted mt-1">
                    {bioState.status === "success" ? bioState.data.metaLabel : ""}
                  </p>
                </div>
                <button className="btn btn-outline btn-sm" type="button">
                  <BellOutlined />
                  Gửi nhắc đăng ký
                </button>
              </div>

              <div className="filter-bar" style={{ padding: "16px 0 0" }}>
                <ChipFilter
                  label="Chi nhánh"
                  options={["Tất cả", ...(bioState.status === "success" ? bioState.data.branches : [])]}
                  value={branch}
                  onChange={setBranch}
                />
                <ChipFilter
                  label="Phòng ban"
                  options={[
                    "Tất cả",
                    ...(bioState.status === "success" ? bioState.data.departments : []),
                  ]}
                  value={department}
                  onChange={setDepartment}
                />
                <div className="filter-spacer">
                  <ToggleChip active={pendingOnly} onClick={() => setPendingOnly((v) => !v)}>
                    Chưa đăng ký sinh trắc học
                  </ToggleChip>
                </div>
              </div>

              {bioState.status === "error" ? (
                <div className="empty-state">
                  <p>{bioState.message}</p>
                  <button className="btn btn-outline btn-sm mt-2" type="button" onClick={reloadBio}>
                    <ReloadOutlined />
                    Thử lại
                  </button>
                </div>
              ) : (
                <div className="table-wrap mt-2">
                  <table className="table">
                    <thead>
                      <tr>
                        <th></th>
                        <th>Nhân viên</th>
                        <th>Phòng ban</th>
                        <th>Chi nhánh</th>
                        <th>Sinh trắc học</th>
                        <th style={{ textAlign: "right" }}>Cập nhật</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bioState.status === "loading"
                        ? Array.from({ length: 4 }).map((_, index) => (
                            <tr key={index}>
                              <td colSpan={6}>
                                <div className="skeleton" style={{ height: 20 }} />
                              </td>
                            </tr>
                          ))
                        : bioState.data.rows.map((row) => {
                            const bio = BIOMETRIC_LABEL[row.biometricStatus];
                            return (
                              <tr key={row.id}>
                                <td>
                                  <div className="avatar">{initialsOf(row.name)}</div>
                                </td>
                                <td>
                                  <div className="cell-copy">
                                    <strong>{row.name}</strong>
                                    <small>{row.code}</small>
                                  </div>
                                </td>
                                <td>{row.department}</td>
                                <td>{row.branch}</td>
                                <td>
                                  <span className={`badge badge-${bio.tone}`}>{bio.label}</span>
                                </td>
                                <td className="text-xs text-muted" style={{ textAlign: "right" }}>
                                  {row.biometricMeta}
                                </td>
                              </tr>
                            );
                          })}
                    </tbody>
                  </table>
                  {bioState.status === "success" && bioState.data.rows.length === 0 ? (
                    <div className="table-empty">Không có nhân viên nào khớp bộ lọc hiện tại.</div>
                  ) : null}
                </div>
              )}

              {bioState.status === "success" ? (
                <div className="table-foot">
                  <span>
                    Hiển thị {bioState.data.rows.length} / {bioState.data.totalCount} nhân viên
                  </span>
                  <a className="link-primary text-xs" href="#">
                    Xuất danh sách chưa đăng ký
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
