import { useState } from "react";
import {
  HistoryOutlined,
  PlusOutlined,
  WarningOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { AppShell } from "../../components/layout/AppShell";
import { ChipFilter, ToggleChip } from "../../components/filters/ChipFilter";
import { useAsyncData } from "../../lib/useAsyncData";
import { fetchKiosks } from "./kiosk.api";
import { KIOSK_STATUS_LABEL } from "./kiosk.types";

export default function KioskPage() {
  const [branch, setBranch] = useState("Tất cả");
  const [zone, setZone] = useState("Tất cả");
  const [issueOnly, setIssueOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [state, reload] = useAsyncData(
    (signal) => fetchKiosks({ branch, zone, issueOnly }, signal),
    [branch, zone, issueOnly],
  );

  const devices = state.status === "success" ? state.data.devices : [];
  const selected = devices.find((d) => d.id === selectedId) ?? devices[0] ?? null;

  return (
    <AppShell
      activeKey="kiosk"
      title="Quản lý thiết bị Kiosk"
      subtitle={state.status === "success" ? state.data.headerMeta : undefined}
      actions={
        <>
          <button className="btn btn-outline btn-sm" type="button">
            <HistoryOutlined />
            Nhật ký heartbeat
          </button>
          <button className="btn btn-primary btn-sm" type="button">
            <PlusOutlined />
            Ghép thiết bị mới
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
                label="Khu vực lắp đặt"
                options={["Tất cả", ...(state.status === "success" ? state.data.zones : [])]}
                value={zone}
                onChange={setZone}
              />
              <div className="filter-spacer">
                <ToggleChip active={issueOnly} onClick={() => setIssueOnly((v) => !v)} tone="danger">
                  Chỉ thiết bị có sự cố
                </ToggleChip>
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
                      <th>Thiết bị</th>
                      <th>Chi nhánh</th>
                      <th>Heartbeat</th>
                      <th>Phiên bản</th>
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
                      : devices.map((device) => {
                          const statusMeta = KIOSK_STATUS_LABEL[device.status];
                          return (
                            <tr
                              key={device.id}
                              className={`is-clickable${device.id === selected?.id ? " is-selected" : ""}`}
                              onClick={() => setSelectedId(device.id)}
                            >
                              <td>
                                <div
                                  className="avatar"
                                  style={{
                                    background: `var(--color-${statusMeta.tone}-bg)`,
                                    color: `var(--color-${statusMeta.tone})`,
                                  }}
                                >
                                  {device.tag}
                                </div>
                              </td>
                              <td>
                                <div className="cell-copy">
                                  <strong>{device.name}</strong>
                                  <small>
                                    {device.zone} · {device.ip}
                                  </small>
                                </div>
                              </td>
                              <td>{device.branch}</td>
                              <td>
                                <div className="cell-copy">
                                  <span className="text-sm">{device.heartbeatLabel}</span>
                                  <small>{device.heartbeatMeta}</small>
                                </div>
                              </td>
                              <td>{device.version}</td>
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
                {state.status === "success" && devices.length === 0 ? (
                  <div className="table-empty">Không có thiết bị nào khớp bộ lọc hiện tại.</div>
                ) : null}
              </div>
              {state.status === "success" ? (
                <div className="table-foot">
                  <span>
                    Hiển thị {devices.length} / {devices.length} thiết bị
                  </span>
                  <a className="link-primary text-xs" href="#">
                    Xuất nhật ký
                  </a>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-4">
              {state.status === "loading" ? (
                <div className="card">
                  <div className="skeleton" style={{ height: 320 }} />
                </div>
              ) : selected ? (
                <>
                  <div className="card">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm" style={{ fontWeight: 500 }}>
                          {selected.name}
                        </div>
                        <div className="text-xs text-muted">
                          {selected.zone} · {selected.branch}
                        </div>
                      </div>
                      <span className={`badge badge-${KIOSK_STATUS_LABEL[selected.status].tone}`}>
                        {KIOSK_STATUS_LABEL[selected.status].label}
                      </span>
                    </div>

                    <div className="flex flex-col gap-3 mt-4">
                      <div className="kv-row">
                        <span className="kv-label">Mã thiết bị</span>
                        <span className="kv-value">{selected.id}</span>
                      </div>
                      <div className="kv-row">
                        <span className="kv-label">Địa chỉ IP</span>
                        <span className="kv-value">{selected.ip}</span>
                      </div>
                      <div className="kv-row">
                        <span className="kv-label">Phiên bản app</span>
                        <span className="kv-value">{selected.version}</span>
                      </div>
                      <div className="kv-row">
                        <span className="kv-label">Heartbeat cuối</span>
                        <span className="kv-value">{selected.heartbeatLabel}</span>
                      </div>
                      <div className="kv-row">
                        <span className="kv-label">Lượt chấm hôm nay</span>
                        <span className="kv-value">{selected.scansToday}</span>
                      </div>
                      <div className="kv-row">
                        <span className="kv-label">Uptime 30 ngày</span>
                        <span className="kv-value">{selected.uptimeLabel}</span>
                      </div>
                    </div>

                    {selected.bars.length > 0 ? (
                      <div className="flex flex-col gap-2 mt-4">
                        <span className="text-xs text-muted">Heartbeat 24 giờ qua</span>
                        <div className="mini-bars">
                          {selected.bars.map((bar, index) => (
                            <div
                              key={index}
                              className={`mini-bar${bar.ok ? "" : " tone-danger"}`}
                              style={{ ["--h" as string]: `${bar.heightPercent}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="alert mt-4">
                      <span>{selected.note}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      <button className="btn btn-primary flex-1" type="button">
                        <ReloadOutlined />
                        Khởi động lại từ xa
                      </button>
                      <button className="btn btn-outline flex-1" type="button">
                        Huỷ ghép
                      </button>
                    </div>
                  </div>

                  {selected.events.length > 0 ? (
                    <div className="card">
                      <h2 className="text-sm" style={{ fontWeight: 500 }}>
                        Sự kiện gần đây
                      </h2>
                      <div className="flex flex-col gap-3 mt-4">
                        {selected.events.map((event, index) => (
                          <div key={index} className="kv-row">
                            <div>
                              <div className="text-sm">{event.text}</div>
                              <div className="text-xs text-muted">{event.time}</div>
                            </div>
                            <span className={`badge badge-${event.tone}`}>{event.tag}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="card empty-state">Chưa có thiết bị nào để hiển thị.</div>
              )}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
