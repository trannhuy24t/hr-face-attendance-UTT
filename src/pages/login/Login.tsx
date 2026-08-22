import { useState } from "react";
import type { FormEvent } from "react";
import {
  UserOutlined,
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  LoadingOutlined,
  ShopOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { login } from "../../features/auth/auth.api";
import { setAccessToken } from "../../features/auth/authSession";
import { ApiError } from "../../lib/httpClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setSubmitting(true);

    login({ email, password })
      .then((response) => {
        setAccessToken(response.access_token);
        window.location.hash = "dashboard";
      })
      .catch((error: unknown) => {
        setFormError(
          error instanceof ApiError
            ? error.message
            : "Không thể kết nối tới máy chủ, vui lòng thử lại.",
        );
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-visual-brand">
          <ShopOutlined />
          <span>Hệ thống F&amp;B</span>
        </div>

        <div className="auth-visual-body">
          <h2>Quản lý nhà hàng của bạn, gọn trong một nơi.</h2>
          <p>
            Theo dõi chấm công, ca làm, bảng lương và nhân sự trong một hệ
            thống duy nhất, được thiết kế riêng cho ngành F&amp;B.
          </p>
        </div>

        <div className="auth-visual-foot">
          © {new Date().getFullYear()} Hệ thống F&amp;B. Đã đăng ký bản quyền.
        </div>
      </div>

      <div className="auth-form-side">
        <div className="card auth-card">
          <div className="auth-logo">F&amp;B</div>

          <h1 className="auth-title mt-4">Đăng nhập</h1>
          <p className="auth-subtitle mt-2">
            Đăng nhập để quản lý hệ thống nhà hàng của bạn
          </p>

          {formError ? (
            <div className="alert alert-danger mt-4">
              <WarningOutlined />
              <span>{formError}</span>
            </div>
          ) : null}

          <form className="flex flex-col gap-4 mt-6" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label" htmlFor="email">
                Email
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <UserOutlined />
                </span>
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="ban@nhahang.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="password">
                Mật khẩu
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <LockOutlined />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="input"
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-icon-action"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                Ghi nhớ đăng nhập
              </label>
              <a className="link-primary text-sm" href="#">
                Quên mật khẩu?
              </a>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={submitting}
            >
              {submitting ? <LoadingOutlined /> : null}
              {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <p className="auth-footer mt-6">
            Chưa có tài khoản?{" "}
            <a className="link-primary" href="#register">
              Đăng ký doanh nghiệp mới
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
