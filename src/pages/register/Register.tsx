import { useState } from "react";
import type { FormEvent } from "react";
import {
  ShopOutlined,
  BankOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  LoadingOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { registerTenant } from "../../features/auth/auth.api";
import { setAccessToken, setCurrentUser } from "../../features/auth/authSession";
import { ApiError } from "../../lib/httpClient";

export default function RegisterPage() {
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (password !== confirmPassword) {
      setFormError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setSubmitting(true);
    registerTenant({
      companyName,
      email,
      password,
      fullName,
      phone: phone.trim() ? phone.trim() : undefined,
    })
      .then((response) => {
        setAccessToken(response.access_token);
        setCurrentUser({
          id: response.user.id,
          email: response.user.email,
          fullName: response.user.fullName,
          roles: [{ branch_id: null, role: "owner" }],
        });
        setDone(true);
        window.setTimeout(() => {
          window.location.hash = "employees";
        }, 1200);
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
          <h2>Bắt đầu số hoá vận hành nhà hàng chỉ trong vài phút.</h2>
          <p>
            Đăng ký doanh nghiệp để khởi tạo chi nhánh chính, tài khoản chủ sở
            hữu và toàn bộ cấu hình mặc định của hệ thống.
          </p>
        </div>

        <div className="auth-visual-foot">
          © {new Date().getFullYear()} Hệ thống F&amp;B. Đã đăng ký bản quyền.
        </div>
      </div>

      <div className="auth-form-side">
        <div className="card auth-card auth-card-wide">
          <div className="auth-logo">F&amp;B</div>

          <h1 className="auth-title mt-4">Đăng ký doanh nghiệp</h1>
          <p className="auth-subtitle mt-2">
            Tạo tài khoản chủ sở hữu và chi nhánh chính cho nhà hàng của bạn
          </p>

          {formError ? (
            <div className="alert alert-danger mt-4">
              <WarningOutlined />
              <span>{formError}</span>
            </div>
          ) : null}

          {done ? (
            <div className="alert alert-success mt-4">
              <CheckCircleOutlined />
              <span>Đăng ký thành công! Đang chuyển vào hệ thống...</span>
            </div>
          ) : null}

          <form className="form-grid mt-6" onSubmit={handleSubmit}>
            <div className="form-group form-field-full">
              <label className="label" htmlFor="companyName">
                Tên công ty
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <BankOutlined />
                </span>
                <input
                  id="companyName"
                  type="text"
                  className="input"
                  placeholder="Công ty TNHH ABC"
                  autoComplete="organization"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  required
                  disabled={done}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="fullName">
                Họ và tên
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <UserOutlined />
                </span>
                <input
                  id="fullName"
                  type="text"
                  className="input"
                  placeholder="Nguyễn Văn A"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  disabled={done}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="phone">
                Số điện thoại <span className="text-muted">(không bắt buộc)</span>
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <PhoneOutlined />
                </span>
                <input
                  id="phone"
                  type="tel"
                  className="input"
                  placeholder="0912345678"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  disabled={done}
                />
              </div>
            </div>

            <div className="form-group form-field-full">
              <label className="label" htmlFor="email">
                Email
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <MailOutlined />
                </span>
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="giamdoc@abc.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={done}
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
                  placeholder="Tối thiểu 8 ký tự"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}"
                  title="Tối thiểu 8 ký tự, có ít nhất 1 chữ hoa, 1 chữ thường và 1 số"
                  required
                  disabled={done}
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

            <div className="form-group">
              <label className="label" htmlFor="confirmPassword">
                Xác nhận mật khẩu
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <LockOutlined />
                </span>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  className="input"
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  disabled={done}
                />
              </div>
            </div>

            <p className="text-xs text-muted form-field-full" style={{ marginTop: -8 }}>
              Mật khẩu cần tối thiểu 8 ký tự, có ít nhất 1 chữ hoa, 1 chữ thường và 1 số.
            </p>

            <button
              type="submit"
              className="btn btn-primary btn-block form-field-full"
              disabled={submitting || done}
            >
              {submitting ? <LoadingOutlined /> : null}
              {submitting ? "Đang đăng ký..." : "Đăng ký doanh nghiệp"}
            </button>
          </form>

          <p className="auth-footer mt-6">
            Đã có tài khoản?{" "}
            <a className="link-primary" href="#">
              Đăng nhập
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
