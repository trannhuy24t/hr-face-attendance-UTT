import { useState } from "react";
import {
  LeftOutlined,
  RightOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { AppShell } from "../../components/layout/AppShell";
import { ChipFilter, ToggleChip } from "../../components/filters/ChipFilter";
import { useAsyncData } from "../../lib/useAsyncData";
import { initialsOf } from "../../lib/textUtils";
import { fetchSchedule } from "./schedule.api";
import { SHIFT_META } from "./schedule.types";

export default function SchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [branch, setBranch] = useState("Tất cả");
  const [department, setDepartment] = useState("Tất cả");
  const [gapOnly, setGapOnly] = useState(false);

  const [state, reload] = useAsyncData(
    (signal) => fetchSchedule({ weekOffset, branch, department, gapOnly }, signal),
    [weekOffset, branch, department, gapOnly],
  );

  return (
    <AppShell
      activeKey="schedule"
      title="Lịch phân ca"
      subtitle={state.status === "success" ? state.data.weekLabel : undefined}
      actions={
        <>
          <div className="flex items-center gap-1">
            <button
              className="btn btn-outline btn-sm"
              type="button"
              onClick={() => setWeekOffset((w) => w - 1)}
              aria-label="Tuần trước"
            >
              <LeftOutlined />
            </button>
            <button
              className="btn btn-outline btn-sm"
              type="button"
              onClick={() => setWeekOffset(0)}
            >
              Tuần này
            </button>
            <button
              className="btn btn-outline btn-sm"
              type="button"
              onClick={() => setWeekOffset((w) => w + 1)}
              aria-label="Tuần sau"
            >
              <RightOutlined />
            </button>
          </div>
          <button className="btn btn-primary btn-sm" type="button">
            <ThunderboltOutlined />
            Phân ca hàng loạt
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
              onChange={setBranch}
            />
            <ChipFilter
              label="Phòng ban"
              options={["Tất cả", ...(state.status === "success" ? state.data.departments : [])]}
              value={department}
              onChange={setDepartment}
            />
            <div className="filter-spacer">
              <ToggleChip active={gapOnly} onClick={() => setGapOnly((v) => !v)} tone="danger">
                Chỉ ca thiếu người
              </ToggleChip>
            </div>
          </div>

          {state.status === "loading" ? (
            <div className="skeleton" style={{ height: 320, margin: 16 }} />
          ) : state.status === "success" ? (
            <>
              <div className="schedule-grid">
                <div className="schedule-head">
                  <div>Nhân viên</div>
                  {state.data.days.map((day) => (
                    <div key={day.date}>
                      <div>{day.dow}</div>
                      <strong>{day.date}</strong>
                    </div>
                  ))}
                </div>

                {state.data.rows.map((row) => (
                  <div key={row.id} className="schedule-row">
                    <div className="schedule-person">
                      <div className="avatar avatar-sm">{initialsOf(row.name)}</div>
                      <div className="cell-copy">
                        <strong>{row.name}</strong>
                        <small>{row.meta}</small>
                      </div>
                    </div>
                    {row.cells.map((code, index) => {
                      const shift = SHIFT_META[code];
                      return (
                        <div key={index} className="schedule-cell">
                          <div className={`shift-tile tone-${shift.tone}`}>
                            <div>{shift.label}</div>
                            <span>{shift.time}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {state.data.rows.length === 0 ? (
                <div className="table-empty">Không có nhân viên nào khớp bộ lọc hiện tại.</div>
              ) : null}

              <div className="table-foot">
                <span>
                  {state.data.rows.length} nhân viên · {state.data.gapCount} ca chưa đủ người
                  trong tuần
                </span>
                <div className="legend-row">
                  {(["S", "C", "D", "X", "O"] as const).map((code) => {
                    const shift = SHIFT_META[code];
                    return (
                      <div key={code} className="legend-item">
                        <span
                          className="legend-swatch"
                          style={
                            shift.tone === "off"
                              ? undefined
                              : {
                                  background: `var(--color-${shift.tone}-bg)`,
                                  borderColor: `var(--color-${shift.tone})`,
                                }
                          }
                        />
                        {shift.label}
                        {code !== "O" ? ` ${shift.time}` : ""}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}
