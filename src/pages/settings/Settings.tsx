import { useEffect, useState } from "react";
import { SaveOutlined, WarningOutlined, ReloadOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { AppShell } from "../../components/layout/AppShell";
import { useAsyncData } from "../../lib/useAsyncData";
import { ApiError } from "../../lib/httpClient";
import { fetchTenantSettings, updateTenantSettings } from "./settings.api";

export default function SettingsPage() {
  const [state, reload] = useAsyncData((signal) => fetchTenantSettings(signal), []);

  const [threshold, setThreshold] = useState("0.85");
  const [maxRetries, setMaxRetries] = useState("3");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (state.status === "success") {
      setThreshold(String(state.data.faceMatchThreshold));
      setMaxRetries(String(state.data.maxFaceRetries));
    }
  }, [state.status === "success" ? state.data : null]);

  const handleSave = () => {
    setSaveError("");
    setSaved(false);

    const thresholdValue = Number(threshold);
    const maxRetriesValue = Number(maxRetries);

    if (Number.isNaN(thresholdValue) || thresholdValue < 0.5 || thresholdValue > 1) {
      setSaveError("Ngưỡng khớp khuôn mặt phải trong khoảng 0.5 - 1.0");
      return;
    }
    if (!Number.isInteger(maxRetriesValue) || maxRetriesValue < 1 || maxRetriesValue > 10) {
      setSaveError("Số lần thử lại phải là số nguyên trong khoảng 1 - 10");
      return;
    }

    setSaving(true);
    updateTenantSettings({
      faceMatchThreshold: thresholdValue,
      maxFaceRetries: maxRetriesValue,
    })
      .then(() => setSaved(true))
      .catch((error: unknown) => {
        setSaveError(
          error instanceof ApiError
            ? error.message
            : "Không thể kết nối tới máy chủ, vui lòng thử lại.",
        );
      })
      .finally(() => setSaving(false));
  };

  return (
    <AppShell
      activeKey="settings"
      title="Cài đặt hệ thống"
      subtitle={
        state.status === "success" ? `Tenant ID: ${state.data.tenantId}` : undefined
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
        <div className="card" style={{ maxWidth: 520, padding: 24 }}>
          <h2 className="text-sm" style={{ fontWeight: 500 }}>
            Cấu hình nhận diện khuôn mặt
          </h2>
          <p className="text-xs text-muted mt-1">
            Áp dụng cho toàn bộ Kiosk chấm công của doanh nghiệp.
          </p>

          {state.status === "loading" ? (
            <div className="flex flex-col gap-4 mt-6">
              <div className="skeleton" style={{ height: 44 }} />
              <div className="skeleton" style={{ height: 44 }} />
            </div>
          ) : (
            <div className="flex flex-col gap-4 mt-6">
              {saveError ? (
                <div className="alert alert-danger">
                  <WarningOutlined />
                  <span>{saveError}</span>
                </div>
              ) : null}
              {saved ? (
                <div className="alert alert-success">
                  <CheckCircleOutlined />
                  <span>Đã lưu cấu hình thành công.</span>
                </div>
              ) : null}

              <div className="form-group">
                <label className="label" htmlFor="faceMatchThreshold">
                  Ngưỡng khớp khuôn mặt (0.5 – 1.0)
                </label>
                <input
                  id="faceMatchThreshold"
                  className="input"
                  style={{ paddingInline: 12 }}
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="1"
                  value={threshold}
                  onChange={(event) => {
                    setThreshold(event.target.value);
                    setSaved(false);
                  }}
                />
                <span className="text-xs text-muted">
                  Cao hơn → chính xác hơn nhưng dễ từ chối nhầm. Khuyến nghị 0.80 – 0.90.
                </span>
              </div>

              <div className="form-group">
                <label className="label" htmlFor="maxFaceRetries">
                  Số lần thử lại tối đa (1 – 10)
                </label>
                <input
                  id="maxFaceRetries"
                  className="input"
                  style={{ paddingInline: 12 }}
                  type="number"
                  step="1"
                  min="1"
                  max="10"
                  value={maxRetries}
                  onChange={(event) => {
                    setMaxRetries(event.target.value);
                    setSaved(false);
                  }}
                />
                <span className="text-xs text-muted">
                  Vượt quá số lần này, Kiosk sẽ chuyển sang mã PIN/QR dự phòng.
                </span>
              </div>

              <button
                className="btn btn-primary"
                type="button"
                disabled={saving}
                onClick={handleSave}
                style={{ alignSelf: "flex-start" }}
              >
                <SaveOutlined />
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
