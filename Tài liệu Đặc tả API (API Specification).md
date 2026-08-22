# TÀI LIỆU ĐẶC TẢ API CHI TIẾT

**(API SPECIFICATION DOCUMENT)**

**Hệ thống Quản lý Nhân sự, Chấm công Sinh trắc học & Tính lương Multi-Tenant**

---

## Mục lục

1. [Giới thiệu & Quy ước chung](#1-giới-thiệu--quy-ước-chung)
2. [Xác thực & Phân quyền (Authentication & Authorization)](#2-xác-thực--phân-quyền)
3. [Phân hệ 1: Quản trị & Cấu trúc Tổ chức (Organization)](#3-phân-hệ-1-quản-trị--cấu-trúc-tổ-chức)
4. [Phân hệ 2: Quản lý Nhân sự & Tài khoản (Employees & Users)](#4-phân-hệ-2-quản-lý-nhân-sự--tài-khoản)
5. [Phân hệ 3: Sinh trắc học & Thiết bị Kiosk (Biometrics)](#5-phân-hệ-3-sinh-trắc-học--thiết-bị-kiosk)
6. [Phân hệ 4: Phân ca & Chấm công (Shifts & Attendance)](#6-phân-hệ-4-phân-ca--chấm-công)
7. [Phân hệ 5: Quản lý Nghỉ phép (Leave Management)](#7-phân-hệ-5-quản-lý-nghỉ-phép)
8. [Phân hệ 6: Tính Lương (Payroll Management)](#8-phân-hệ-6-tính-lương)
9. [Phân hệ 7: Hệ thống, Thông báo & Kiểm toán (System)](#9-phân-hệ-7-hệ-thống-thông-báo--kiểm-toán)
10. [Phụ lục A — Mã lỗi HTTP chuẩn](#phụ-lục-a--mã-lỗi-http-chuẩn)
11. [Phụ lục B — Ma trận Quyền API theo Vai trò](#phụ-lục-b--ma-trận-quyền-api-theo-vai-trò)

---

## 1. Giới thiệu & Quy ước chung

### 1.1. Mục đích tài liệu

Tài liệu này đặc tả chi tiết toàn bộ RESTful API endpoints của hệ thống, bao gồm: URL, HTTP method, request/response schema, mã lỗi, phân quyền, và quy tắc nghiệp vụ tương ứng. Tài liệu dùng làm nguồn tham chiếu chính cho đội ngũ Backend, Frontend, Mobile, Kiosk và QA.

### 1.2. Base URL

```
Production:  https://api.utt-saas.com/api/v1
Staging:     https://staging-api.utt-saas.com/api/v1
```

### 1.3. Quy ước chung

| Hạng mục | Quy ước |
| :--- | :--- |
| **Định dạng dữ liệu** | JSON (`Content-Type: application/json`) |
| **Encoding** | UTF-8 |
| **Mã hóa truyền tải** | TLS 1.2+ (HTTPS bắt buộc) |
| **Xác thực** | Bearer JWT Token trong header `Authorization` |
| **Đa khách thuê** | `tenant_id` được trích xuất từ JWT, tự động inject vào mọi truy vấn |
| **Múi giờ** | Tất cả timestamp trả về định dạng ISO 8601 UTC (`2026-07-15T08:30:00Z`). Client chuyển đổi theo `timezone` chi nhánh |
| **Phân trang** | Query params: `page` (default 1), `page_size` (default 20, max 100) |
| **Sắp xếp** | Query param: `sort_by` (field name), `sort_order` (`asc`/`desc`) |
| **Soft Delete** | Record bị xóa mềm (`deleted_at != null`) không trả về trong list mặc định |
| **Idempotency** | Các endpoint ghi nhận từ Kiosk bắt buộc header `Idempotency-Key` |
| **Rate Limiting** | 100 req/min cho Portal API, 300 req/min cho Kiosk API |

### 1.4. Cấu trúc Response chuẩn

**Thành công (Success):**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "page_size": 20,
    "total_items": 150,
    "total_pages": 8
  }
}
```

**Lỗi (Error):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Mô tả lỗi cho người dùng",
    "details": [
      {
        "field": "email",
        "message": "Email đã tồn tại trong hệ thống"
      }
    ]
  }
}
```

### 1.5. Quy ước Truy vết Yêu cầu (Traceability)

Mỗi endpoint được gắn mã FR (Functional Requirement) tương ứng từ tài liệu SRS để đảm bảo truy vết đầy đủ.

---

## 2. Xác thực & Phân quyền

> **Tham chiếu SAD:** Mục 6.1 – Quy trình OAuth2 / JWT Token với Refresh Token Rotation
> **Tham chiếu SRS:** FR-EMP-06, FR-EMP-07, FR-EMP-08, FR-EMP-09

---

### 2.1. `POST /api/v1/auth/register` — Đăng ký Tenant mới

> **Traceability:** FR-ORG-01, FR-ORG-02, FR-ORG-03, FR-EMP-06, FR-EMP-08
> **Quyền:** Public (không yêu cầu xác thực)

**Mô tả:** Đăng ký doanh nghiệp mới, tự động tạo Tenant + Cấu hình mặc định + Chi nhánh mặc định + Tài khoản Owner + Phân quyền Owner. Xử lý trong một Atomic Transaction.

**Request Body:**
```json
{
  "companyName": "string, required — Tên công ty/tổ chức",
  "email": "string, required — Email đăng nhập Owner (unique toàn hệ thống)",
  "password": "string, required — Mật khẩu (min 8 ký tự, chứa chữ hoa, chữ thường, số)",
  "phone": "string, optional — Số điện thoại liên hệ",
  "fullName": "string, required — Họ tên chủ doanh nghiệp"
}
```

**Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "uuid",
      "name": "Công ty ABC"
    },
    "user": {
      "id": "uuid",
      "email": "owner@abc.com",
      "fullName": "Nguyễn Văn A",
      "role": "owner"
    },
    "branch": {
      "id": "uuid",
      "name": "Trụ sở chính",
      "timezone": "Asia/Ho_Chi_Minh",
      "currency": "VND"
    },
    "access_token": "JWT string (TTL 15 phút)"
  }
}
```
*(Lưu ý: Refresh Token được gửi qua HttpOnly Cookie, không xuất hiện trong JSON. Payload của JWT sẽ chứa `sid` là mã session id)*

**Lỗi:**

| HTTP Code | Error Code | Mô tả |
| :--- | :--- | :--- |
| 409 | `EMAIL_ALREADY_EXISTS` | Email đã tồn tại trong hệ thống |
| 400 | `VALIDATION_ERROR` | Dữ liệu đầu vào không hợp lệ |

**Logic nghiệp vụ:**
1. Chuẩn hóa email: `trim()` + `toLowerCase()` (tránh trùng lặp do viết hoa/thường).
2. Kiểm tra email unique trong bảng `users`.
3. Băm mật khẩu bằng Argon2.
4. Tạo Atomic Transaction gồm 5 bước: `tenants` → `tenant_settings` (threshold đọc từ .env) → `branches` (Trụ sở chính) → `users` (lưu fullName, phone, email, hash) → `user_branch_roles` (role=owner, branch_id=null).
5. Bắt lỗi Race Condition (Prisma P2002) → trả 409 thay vì 500.
6. Sinh JWT Access Token + Refresh Token.

---

### 2.2. `POST /api/v1/auth/login` — Đăng nhập

> **Quyền:** Public

**Request Body:**
```json
{
  "email": "string, required",
  "password": "string, required"
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "string",
      "fullName": "string",
      "roles": [
        {
          "branch_id": "uuid | null",
          "role": "owner | manager | accountant | staff"
        }
      ]
    },
    "access_token": "JWT string (TTL 15 phút)"
  }
}
```
*(Lưu ý: `refresh_token` không trả về trong JSON mà được set tự động vào trình duyệt thông qua `Set-Cookie` với cờ `HttpOnly`, `Secure`, `SameSite=Strict`)*

**Lỗi:**

| HTTP Code | Error Code | Mô tả |
| :--- | :--- | :--- |
| 401 | `INVALID_CREDENTIALS` | Email hoặc mật khẩu không đúng (cố ý dùng thông báo mơ hồ để không tiết lộ email nào đã đăng ký) |

**JWT Payload:**
```json
{
  "sub": "user_id (uuid)",
  "tenant_id": "uuid",
  "employee_id": "uuid | null",
  "roles": [{ "branch_id": "uuid|null", "role": "string" }],
  "typ": "access | refresh",
  "sid": "auth_session_id (chỉ có trong refresh token)",
  "jti": "jwt_id (chỉ có trong refresh token)",
  "iat": 1720000000,
  "exp": 1720000900
}
```

> **Ghi chú Multi-Device:** Khi người dùng gọi Login, hệ thống sẽ sinh ra một bản ghi trong bảng `auth_sessions`. Refresh Token sẽ chứa ID của session này trong claim `sid`. Điều này cho phép một người dùng đăng nhập trên nhiều thiết bị (Web, Mobile) cùng lúc mà không bị đá văng lẫn nhau.

---

### 2.3. `POST /api/v1/auth/refresh` — Làm mới Token

> **Quyền:** Authenticated (Thông qua HttpOnly Cookie chứa Refresh Token)

**Request Body:** Trống (Không cần body vì token được gửi qua Cookie)

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "access_token": "JWT string mới"
  }
}
```
*(Server sẽ tự động gửi `Set-Cookie` để cập nhật Refresh Token mới trên trình duyệt)*

**Logic:**
- Trích xuất Refresh Token từ HttpOnly Cookie.
- Giải mã Token, băm SHA-256 và đối chiếu với cột `refresh_token_hash` trong bảng `users`.
- Nếu khớp: Cấp Access Token mới, sinh Refresh Token mới, băm và cập nhật lại vào DB (Token Rotation).
- Nếu không khớp: Xóa hash trong DB (Force Logout) và báo lỗi 401.

---

### 2.4. `POST /api/v1/auth/logout` — Đăng xuất

> **Quyền:** Authenticated (Bảo vệ bởi JwtAuthGuard)

**Request Body:** Trống

**Response `200 OK`:**
```json
{
  "success": true,
  "data": { "message": "Đăng xuất thành công" }
}
```

**Logic:**
- Lấy `user_id` từ Access Token hiện tại.
- UPDATE `refresh_token_hash = NULL` trong bảng `users`.
- Gửi lệnh `Clear-Cookie` để xóa Refresh Token khỏi trình duyệt.

---

### 2.5. `POST /api/v1/auth/forgot-password` — Quên mật khẩu

> **Quyền:** Public

**Request Body:**
```json
{
  "email": "string, required"
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "data": { "message": "Email hướng dẫn khôi phục mật khẩu đã được gửi (nếu email tồn tại trong hệ thống)" }
}
```

**Logic:** Sinh mã token ngẫu nhiên, băm token lưu vào `password_reset_token` và lưu `password_reset_expires` (hiệu lực 15 phút). Gửi token qua Email (hoặc OTP). Tránh tiết lộ việc email có tồn tại hay không bằng cách luôn trả về thông báo thành công chung chung.

---

### 2.6. `POST /api/v1/auth/reset-password` — Đặt lại mật khẩu

> **Quyền:** Public

**Request Body:**
```json
{
  "token": "string, required — Mã token nhận được từ Email",
  "new_password": "string, required — Mật khẩu mới"
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "data": { "message": "Mật khẩu đã được đặt lại thành công" }
}
```

**Lỗi:**

| HTTP Code | Error Code | Mô tả |
| :--- | :--- | :--- |
| 400 | `INVALID_OR_EXPIRED_TOKEN` | Token không hợp lệ hoặc đã hết hạn |

**Logic:** Tìm user có token đã băm khớp với token gửi lên và `password_reset_expires > NOW()`. Đổi `password_hash`, sau đó xóa `password_reset_token` và `password_reset_expires` (đặt thành null).

---

## 3. Phân hệ 1: Quản trị & Cấu trúc Tổ chức

> **Tham chiếu SRS:** FR-ORG-01 → FR-ORG-07
> **Bảng CSDL:** `tenants`, `tenant_settings`, `branches`, `departments`, `holidays`

---

### 3.1. Tenant Settings

#### `GET /api/v1/tenants/settings` — Lấy cấu hình Tenant

> **Traceability:** FR-ORG-02
> **Quyền:** Owner, System Admin

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    "face_match_threshold": 0.85,
    "max_face_retries": 3
  }
}
```

---

#### `PUT /api/v1/tenants/settings` — Cập nhật cấu hình Tenant

> **Traceability:** FR-ORG-02
> **Quyền:** Owner, System Admin

**Request Body:**
```json
{
  "face_match_threshold": "decimal, optional — Ngưỡng khớp khuôn mặt (0.0 - 1.0)",
  "max_face_retries": "integer, optional — Số lần thử lại tối đa (1-10)"
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    "face_match_threshold": 0.90,
    "max_face_retries": 5
  }
}
```

**Validation:**
- `face_match_threshold`: 0.0 ≤ value ≤ 1.0
- `max_face_retries`: 1 ≤ value ≤ 10

---

### 3.2. Branches (Chi nhánh)

#### `GET /api/v1/branches` — Danh sách chi nhánh

> **Traceability:** FR-ORG-03
> **Quyền:** Owner (tất cả), Manager/Accountant/Staff (chỉ chi nhánh được gán)

**Query Parameters:**

| Param | Type | Mô tả |
| :--- | :--- | :--- |
| `page` | integer | Trang hiện tại (default: 1) |
| `page_size` | integer | Số bản ghi/trang (default: 20, max: 100) |
| `search` | string | Tìm theo tên chi nhánh |
| `include_deleted` | boolean | Bao gồm chi nhánh đã xóa mềm (default: false) |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "name": "Chi nhánh Quận 1",
      "timezone": "Asia/Ho_Chi_Minh",
      "currency": "VND",
      "weekly_off_days": ["sunday"],
      "created_at": "2026-07-01T00:00:00Z",
      "deleted_at": null
    }
  ],
  "meta": { "page": 1, "page_size": 20, "total_items": 5, "total_pages": 1 }
}
```

---

#### `POST /api/v1/branches` — Tạo chi nhánh mới

> **Traceability:** FR-ORG-03
> **Quyền:** Owner

**Request Body:**
```json
{
  "name": "string, required — Tên chi nhánh (unique trong Tenant)",
  "timezone": "string, required — IANA timezone (VD: 'Asia/Ho_Chi_Minh')",
  "currency": "string, required — Mã tiền tệ ISO 4217 (VD: 'VND', 'USD')",
  "weekly_off_days": "string[], optional — Ngày nghỉ cố định trong tuần ['sunday', 'saturday']"
}
```

**Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    "name": "Chi nhánh Quận 7",
    "timezone": "Asia/Ho_Chi_Minh",
    "currency": "VND",
    "weekly_off_days": ["sunday"],
    "created_at": "2026-08-01T10:00:00Z",
    "deleted_at": null
  }
}
```

---

#### `GET /api/v1/branches/:branch_id` — Chi tiết chi nhánh

> **Traceability:** FR-ORG-03
> **Quyền:** Owner, Manager (chi nhánh được gán), Accountant, Staff (chi nhánh mình)

**Response `200 OK`:** Trả về object chi nhánh đầy đủ (tương tự item trong danh sách).

---

#### `PUT /api/v1/branches/:branch_id` — Cập nhật chi nhánh

> **Traceability:** FR-ORG-03
> **Quyền:** Owner

**Request Body:** Tương tự POST, tất cả trường là optional (partial update).

**Response `200 OK`:** Trả về chi nhánh đã cập nhật.

---

#### `DELETE /api/v1/branches/:branch_id` — Xóa mềm chi nhánh

> **Traceability:** FR-ORG-07
> **Quyền:** Owner

**Response `200 OK`:**
```json
{
  "success": true,
  "data": { "message": "Chi nhánh đã được vô hiệu hóa", "deleted_at": "2026-08-01T10:00:00Z" }
}
```

**Logic:** Gán `deleted_at = NOW()`. Chi nhánh không còn xuất hiện trong danh sách mặc định nhưng dữ liệu lịch sử được giữ lại.

---

### 3.3. Departments (Phòng ban)

#### `GET /api/v1/branches/:branch_id/departments` — Danh sách phòng ban theo chi nhánh

> **Traceability:** FR-ORG-04
> **Quyền:** Owner, Manager (chi nhánh), Accountant, Staff (chi nhánh mình)

**Query Parameters:**

| Param | Type | Mô tả |
| :--- | :--- | :--- |
| `page` | integer | Trang (default: 1) |
| `page_size` | integer | Số bản ghi/trang (default: 20) |
| `search` | string | Tìm theo tên hoặc mã phòng ban |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "branch_id": "uuid",
      "name": "Phòng Kế toán",
      "code": "ACCT",
      "created_at": "2026-07-01T00:00:00Z"
    }
  ],
  "meta": { ... }
}
```

---

#### `POST /api/v1/branches/:branch_id/departments` — Tạo phòng ban

> **Traceability:** FR-ORG-04
> **Quyền:** Owner, Manager (chi nhánh)

**Request Body:**
```json
{
  "name": "string, required — Tên phòng ban",
  "code": "string, required — Mã phòng ban (unique trong phạm vi branch)"
}
```

**Response `201 Created`:** Trả về object phòng ban mới.

**Lỗi:**

| HTTP Code | Error Code | Mô tả |
| :--- | :--- | :--- |
| 409 | `DEPARTMENT_CODE_EXISTS` | Mã phòng ban đã tồn tại trong chi nhánh này |

---

#### `PUT /api/v1/branches/:branch_id/departments/:department_id` — Cập nhật phòng ban

> **Traceability:** FR-ORG-04
> **Quyền:** Owner, Manager (chi nhánh)

**Request Body:** Partial update (name, code optional).

---

#### `DELETE /api/v1/branches/:branch_id/departments/:department_id` — Xóa phòng ban

> **Traceability:** FR-ORG-04
> **Quyền:** Owner

**Response `200 OK`:** Xóa phòng ban (kiểm tra không còn nhân viên active trước khi xóa).

---

### 3.4. Holidays (Ngày lễ)

#### `GET /api/v1/holidays` — Danh sách ngày lễ

> **Traceability:** FR-ORG-05, FR-ORG-06
> **Quyền:** Owner, Manager, Accountant, Staff (read-only)

**Query Parameters:**

| Param | Type | Mô tả |
| :--- | :--- | :--- |
| `branch_id` | uuid | Lọc theo chi nhánh cụ thể |
| `year` | integer | Lọc theo năm |
| `scope` | string | `system` / `tenant` / `branch` — Lọc theo phạm vi áp dụng |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid | null",
      "branch_id": "uuid | null",
      "name": "Tết Nguyên Đán",
      "start_date": "2026-01-29",
      "end_date": "2026-02-04",
      "scope": "tenant",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

**Quy tắc scope:**
- `tenant_id = null, branch_id = null` → Ngày lễ cấp hệ thống
- `tenant_id != null, branch_id = null` → Ngày lễ cấp Tenant
- `tenant_id != null, branch_id != null` → Ngày lễ cấp Chi nhánh

---

#### `POST /api/v1/holidays` — Tạo ngày lễ

> **Traceability:** FR-ORG-05
> **Quyền:** Owner (cấp Tenant/Branch), System Admin (cấp hệ thống)

**Request Body:**
```json
{
  "name": "string, required — Tên ngày lễ",
  "start_date": "date, required — Ngày bắt đầu (YYYY-MM-DD)",
  "end_date": "date, required — Ngày kết thúc (YYYY-MM-DD)",
  "branch_id": "uuid, optional — Nếu null thì áp dụng toàn Tenant"
}
```

---

#### `PUT /api/v1/holidays/:holiday_id` — Cập nhật ngày lễ

> **Traceability:** FR-ORG-05
> **Quyền:** Owner, System Admin

---

#### `DELETE /api/v1/holidays/:holiday_id` — Xóa ngày lễ

> **Traceability:** FR-ORG-05
> **Quyền:** Owner, System Admin

---

## 4. Phân hệ 2: Quản lý Nhân sự & Tài khoản

> **Tham chiếu SRS:** FR-EMP-01 → FR-EMP-10
> **Bảng CSDL:** `employees`, `employee_compensation_history`, `users`, `user_branch_roles`

---

### 4.1. Employees (Nhân viên)

#### `GET /api/v1/employees` — Danh sách nhân viên

> **Traceability:** FR-EMP-10
> **Quyền:** Owner (tất cả), Manager (nhân viên chi nhánh), Staff (chỉ bản thân)

**Query Parameters:**

| Param | Type | Mô tả |
| :--- | :--- | :--- |
| `page` | integer | Trang (default: 1) |
| `page_size` | integer | Số bản ghi/trang (default: 20, max: 100) |
| `branch_id` | uuid | Lọc theo chi nhánh |
| `department_id` | uuid | Lọc theo phòng ban |
| `status` | string | Lọc theo trạng thái: `active`, `probation`, `suspended`, `terminated` |
| `search` | string | Tìm theo mã nhân viên, họ tên |
| `sort_by` | string | Trường sắp xếp: `full_name`, `employee_code`, `created_at` |
| `sort_order` | string | `asc` / `desc` |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "branch_id": "uuid",
      "branch_name": "Chi nhánh Quận 1",
      "department_id": "uuid | null",
      "department_name": "Phòng Kinh doanh | null",
      "employee_code": "EMP-001",
      "full_name": "Nguyễn Văn A",
      "status": "active",
      "termination_date": null,
      "created_at": "2026-01-15T08:00:00Z",
      "updated_at": "2026-07-01T10:00:00Z",
      "deleted_at": null
    }
  ],
  "meta": { "page": 1, "page_size": 20, "total_items": 120, "total_pages": 6 }
}
```

---

#### `POST /api/v1/employees` — Tạo hồ sơ nhân viên

> **Traceability:** FR-EMP-01
> **Quyền:** Owner, Manager (chi nhánh)

**Request Body:**
```json
{
  "employee_code": "string, required — Mã nhân viên (unique trong Tenant)",
  "full_name": "string, required — Họ và tên",
  "branch_id": "uuid, required — Chi nhánh trực thuộc",
  "department_id": "uuid, optional — Phòng ban",
  "status": "string, optional — 'active' | 'probation' (default: 'probation')"
}
```

**Response `201 Created`:** Trả về object nhân viên mới.

**Lỗi:**

| HTTP Code | Error Code | Mô tả |
| :--- | :--- | :--- |
| 409 | `EMPLOYEE_CODE_EXISTS` | Mã nhân viên đã tồn tại trong Tenant |
| 404 | `BRANCH_NOT_FOUND` | Chi nhánh không tồn tại hoặc đã bị xóa |
| 404 | `DEPARTMENT_NOT_FOUND` | Phòng ban không tồn tại |

---

#### `GET /api/v1/employees/:employee_id` — Chi tiết nhân viên

> **Traceability:** FR-EMP-01
> **Quyền:** Owner, Manager (chi nhánh), Staff (chỉ bản thân)

**Response `200 OK`:** Trả về thông tin nhân viên đầy đủ, bao gồm thông tin chi nhánh, phòng ban, và mức lương hiện hành.

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    "branch_id": "uuid",
    "branch_name": "Chi nhánh Quận 1",
    "department_id": "uuid",
    "department_name": "Phòng Kinh doanh",
    "employee_code": "EMP-001",
    "full_name": "Nguyễn Văn A",
    "status": "active",
    "termination_date": null,
    "current_compensation": {
      "contract_type": "full_time",
      "pay_basis": "monthly",
      "rate": 15000000,
      "effective_from": "2026-01-01"
    },
    "has_biometric_consent": true,
    "has_face_samples": true,
    "created_at": "2026-01-15T08:00:00Z",
    "updated_at": "2026-07-01T10:00:00Z"
  }
}
```

---

#### `PUT /api/v1/employees/:employee_id` — Cập nhật hồ sơ nhân viên

> **Traceability:** FR-EMP-01, FR-EMP-02
> **Quyền:** Owner, Manager (chi nhánh)

**Request Body:**
```json
{
  "full_name": "string, optional",
  "branch_id": "uuid, optional — Chuyển chi nhánh",
  "department_id": "uuid, optional",
  "status": "string, optional — 'active' | 'probation' | 'suspended' | 'terminated'",
  "termination_date": "date, optional — Bắt buộc khi status = 'terminated'"
}
```

**Logic nghiệp vụ (FR-EMP-02):**
- Chuyển trạng thái phải tuân theo state machine: `active ⇄ probation ⇄ suspended → terminated`
- Khi chuyển sang `terminated`: bắt buộc `termination_date`, kích hoạt xóa dữ liệu sinh trắc học (FR-BIO-05)
- Mọi thay đổi trạng thái phải sinh `audit_logs`

**Lỗi:**

| HTTP Code | Error Code | Mô tả |
| :--- | :--- | :--- |
| 422 | `INVALID_STATUS_TRANSITION` | Chuyển trạng thái không hợp lệ (VD: active → terminated trực tiếp) |
| 422 | `TERMINATION_DATE_REQUIRED` | Thiếu termination_date khi chuyển sang terminated |

---

#### `DELETE /api/v1/employees/:employee_id` — Xóa mềm nhân viên

> **Traceability:** FR-EMP-03
> **Quyền:** Owner

**Response `200 OK`:**
```json
{
  "success": true,
  "data": { "message": "Nhân viên đã được vô hiệu hóa", "deleted_at": "..." }
}
```

**Logic:** Gán `deleted_at`, vô hiệu hóa tài khoản đăng nhập liên kết, giữ lại dữ liệu lịch sử.

---

### 4.2. Employee Compensation History (Lịch sử lương)

#### `GET /api/v1/employees/:employee_id/compensation-history` — Lịch sử lương/hợp đồng

> **Traceability:** FR-EMP-04
> **Quyền:** Owner, Manager (chi nhánh), Accountant

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "employee_id": "uuid",
      "contract_type": "full_time",
      "pay_basis": "monthly",
      "rate": 15000000,
      "effective_from": "2026-01-01",
      "effective_to": null,
      "is_current": true,
      "created_at": "2026-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "employee_id": "uuid",
      "contract_type": "full_time",
      "pay_basis": "monthly",
      "rate": 12000000,
      "effective_from": "2025-06-01",
      "effective_to": "2025-12-31",
      "is_current": false,
      "created_at": "2025-06-01T00:00:00Z"
    }
  ]
}
```

---

#### `POST /api/v1/employees/:employee_id/compensation-history` — Thêm mức lương mới

> **Traceability:** FR-EMP-04, FR-EMP-05
> **Quyền:** Owner, Accountant

**Request Body:**
```json
{
  "contract_type": "string, required — 'full_time' | 'part_time' | 'internship'",
  "pay_basis": "string, required — 'hourly' | 'daily' | 'shift' | 'monthly'",
  "rate": "decimal, required — Mức lương (> 0)",
  "effective_from": "date, required — Ngày bắt đầu hiệu lực"
}
```

**Logic nghiệp vụ (FR-EMP-05):**
- Tự động gán `effective_to = effective_from - 1 ngày` cho bản ghi đang hiệu lực trước đó (bản ghi có `effective_to = null`).
- Bản ghi mới sẽ có `effective_to = null` (đang hiệu lực).
- Sinh `audit_logs`.

---

### 4.3. Users (Tài khoản)

#### `POST /api/v1/users` — Tạo tài khoản đăng nhập

> **Traceability:** FR-EMP-06
> **Quyền:** Owner, Manager (chi nhánh — chỉ tạo staff/accountant)

**Request Body:**
```json
{
  "email": "string, required — Email đăng nhập (unique toàn hệ thống)",
  "password": "string, required — Mật khẩu (min 8 ký tự)",
  "employee_id": "uuid, optional — Liên kết 1-1 với nhân viên (null nếu tài khoản quản trị)"
}
```

**Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tenant_id": "uuid",
    "email": "nhanvien@abc.com",
    "employee_id": "uuid | null",
    "created_at": "..."
  }
}
```

---

#### `DELETE /api/v1/users/:user_id` — Vô hiệu hóa tài khoản

> **Traceability:** FR-EMP-07
> **Quyền:** Owner

**Logic:** Xóa mềm tài khoản (`deleted_at`), xóa toàn bộ phiên bản ghi trong bảng `auth_sessions` (PostgreSQL) để vô hiệu hóa tất cả các thiết bị đang đăng nhập.

---

### 4.4. User Branch Roles (Phân quyền)

#### `GET /api/v1/users/:user_id/roles` — Danh sách vai trò của tài khoản

> **Traceability:** FR-EMP-08
> **Quyền:** Owner, Manager (chi nhánh)

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "branch_id": "uuid | null",
      "branch_name": "Chi nhánh Quận 1 | Toàn Tenant",
      "role": "manager",
      "created_at": "..."
    }
  ]
}
```

---

#### `POST /api/v1/users/:user_id/roles` — Gán vai trò cho tài khoản

> **Traceability:** FR-EMP-08, FR-EMP-09
> **Quyền:** Owner

**Request Body:**
```json
{
  "branch_id": "uuid, optional — null = quyền cấp toàn Tenant",
  "role": "string, required — 'owner' | 'manager' | 'accountant' | 'staff'"
}
```

**Lỗi:**

| HTTP Code | Error Code | Mô tả |
| :--- | :--- | :--- |
| 409 | `ROLE_ALREADY_ASSIGNED` | Tài khoản đã có vai trò này tại chi nhánh |

**Logic (FR-EMP-09):** Unique constraint trên `(user_id, branch_id, role)` — không cho gán trùng.

---

#### `DELETE /api/v1/users/:user_id/roles/:role_id` — Thu hồi vai trò

> **Traceability:** FR-EMP-08
> **Quyền:** Owner

---

## 5. Phân hệ 3: Sinh trắc học & Thiết bị Kiosk

> **Tham chiếu SRS:** FR-BIO-01 → FR-BIO-11
> **Tham chiếu SAD:** Mục 4 – Kiến trúc Nhận diện Khuôn mặt Hybrid
> **Bảng CSDL:** `biometric_consents`, `face_embedding_samples`, `biometric_deletion_logs`, `kiosks`, `face_verification_logs`

---

### 5.1. Biometric Consents (Cam kết đồng ý)

#### `POST /api/v1/employees/:employee_id/biometric-consents` — Thu thập cam kết

> **Traceability:** FR-BIO-01
> **Quyền:** Owner, Manager (chi nhánh), Staff (bản thân)

**Request Body:**
```json
{
  "consent_type": "string, optional — 'face_recognition' (default)",
  "consent_document_version": "string, optional — Phiên bản tài liệu cam kết"
}
```

**Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employee_id": "uuid",
    "consented_at": "2026-08-01T09:00:00Z",
    "revoked_at": null
  }
}
```

**Validation:** Kiểm tra nhân viên chưa có cam kết hợp lệ (chưa bị revoked).

---

#### `POST /api/v1/employees/:employee_id/biometric-consents/:consent_id/revoke` — Thu hồi cam kết

> **Traceability:** FR-BIO-02
> **Quyền:** Owner, Manager (chi nhánh), Staff (bản thân)

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employee_id": "uuid",
    "consented_at": "2026-08-01T09:00:00Z",
    "revoked_at": "2026-08-09T10:00:00Z"
  }
}
```

**Side Effects:**
1. Gán `revoked_at = NOW()`.
2. Vô hiệu hóa toàn bộ `face_embedding_samples` của nhân viên.
3. Kích hoạt quy trình xóa dữ liệu sinh trắc học → tạo `biometric_deletion_logs`.
4. Sinh `audit_logs`.

---

### 5.2. Face Embedding Samples (Mẫu khuôn mặt)

#### `POST /api/v1/employees/:employee_id/face-samples` — Đăng ký mẫu khuôn mặt

> **Traceability:** FR-BIO-03
> **Quyền:** Owner, Manager (chi nhánh)

**Precondition:** Nhân viên phải có `biometric_consents` hợp lệ (chưa bị revoked).

**Request Body:**
```json
{
  "samples": [
    {
      "descriptor": "float[], required — Vector đặc trưng khuôn mặt (128d hoặc 512d)",
      "angle_label": "string, required — 'front' | 'left_45' | 'right_45'",
      "model_version": "string, required — Phiên bản AI model (VD: 'mobilefacenet-v2.1')"
    }
  ]
}
```

**Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "employee_id": "uuid",
    "samples_count": 3,
    "model_version": "mobilefacenet-v2.1",
    "registered_at": "2026-08-01T09:05:00Z"
  }
}
```

**Lỗi:**

| HTTP Code | Error Code | Mô tả |
| :--- | :--- | :--- |
| 403 | `NO_VALID_CONSENT` | Chưa có cam kết đồng ý hợp lệ |
| 422 | `INSUFFICIENT_SAMPLES` | Phải đăng ký tối thiểu 3 mẫu (front, left_45, right_45) |

**Logic:**
1. Kiểm tra `biometric_consents` hợp lệ.
2. Lưu vectors vào `face_embedding_samples`.
3. Đồng bộ vectors xuống SQLite Cache của Kiosk tại chi nhánh.

---

#### `GET /api/v1/employees/:employee_id/face-samples` — Kiểm tra trạng thái mẫu khuôn mặt

> **Traceability:** FR-BIO-03, FR-BIO-04
> **Quyền:** Owner, Manager (chi nhánh)

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "employee_id": "uuid",
    "has_samples": true,
    "samples_count": 3,
    "model_version": "mobilefacenet-v2.1",
    "is_model_current": true,
    "registered_at": "2026-08-01T09:05:00Z"
  }
}
```

> **Lưu ý bảo mật (NFR 4.6):** API **KHÔNG** trả về giá trị vector descriptor. Chỉ trả metadata.

---

#### `DELETE /api/v1/employees/:employee_id/face-samples` — Xóa dữ liệu sinh trắc học

> **Traceability:** FR-BIO-05
> **Quyền:** Owner, System Admin

**Request Body:**
```json
{
  "reason": "string, required — 'Employee Resigned' | 'Consent Revoked' | 'Model Upgrade' | 'Admin Request'"
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "employee_id": "uuid",
    "samples_deleted": 3,
    "deletion_log_id": "uuid",
    "deleted_at": "2026-08-09T10:00:00Z"
  }
}
```

**Logic:**
1. **Xóa vật lý** `face_embedding_samples` (không phải soft delete).
2. Tạo `biometric_deletion_logs` với reason.
3. Xóa cache vector trên Kiosk SQLite tại chi nhánh.
4. Sinh `audit_logs`.

---

### 5.3. Kiosks (Thiết bị Kiosk)

#### `GET /api/v1/branches/:branch_id/kiosks` — Danh sách Kiosk theo chi nhánh

> **Traceability:** FR-BIO-06
> **Quyền:** Owner, Manager (chi nhánh)

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "branch_id": "uuid",
      "device_name": "Kiosk Tầng 1 - Cửa chính",
      "status": "active",
      "last_seen_at": "2026-08-09T09:30:00Z",
      "created_at": "2026-07-01T00:00:00Z",
      "deleted_at": null
    }
  ]
}
```

---

#### `POST /api/v1/branches/:branch_id/kiosks` — Đăng ký Kiosk mới

> **Traceability:** FR-BIO-06
> **Quyền:** Owner, Manager (chi nhánh)

**Request Body:**
```json
{
  "device_name": "string, required — Tên thiết bị"
}
```

**Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "branch_id": "uuid",
    "device_name": "Kiosk Tầng 2",
    "status": "active",
    "api_key": "kiosk_xxxxxx — API Key dùng cho Kiosk xác thực (chỉ hiển thị 1 lần)",
    "created_at": "..."
  }
}
```

---

#### `PUT /api/v1/branches/:branch_id/kiosks/:kiosk_id` — Cập nhật Kiosk

> **Traceability:** FR-BIO-06
> **Quyền:** Owner, Manager (chi nhánh)

**Request Body:**
```json
{
  "device_name": "string, optional",
  "status": "string, optional — 'active' | 'inactive' | 'flagged'"
}
```

---

#### `POST /api/v1/kiosks/:kiosk_id/heartbeat` — Cập nhật heartbeat Kiosk

> **Traceability:** FR-BIO-07
> **Quyền:** Kiosk Device (API Key)

**Request Body:**
```json
{
  "device_info": "object, optional — Thông tin phần cứng/phiên bản app Kiosk"
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "data": { "last_seen_at": "2026-08-09T09:35:00Z" }
}
```

**Logic:** Cập nhật `last_seen_at = NOW()`. Nếu Kiosk không gửi heartbeat quá ngưỡng (VD 5 phút), hệ thống tự động cảnh báo.

---

### 5.4. Face Verification (Xác thực khuôn mặt)

#### `POST /api/v1/kiosks/:kiosk_id/verify-face` — Xác thực khuôn mặt tại Kiosk

> **Traceability:** FR-BIO-08, FR-BIO-09, FR-BIO-10, FR-BIO-11
> **Quyền:** Kiosk Device (API Key)
> **SLA:** Phản hồi ≤ 2 giây (NFR Performance)

**Headers:**
```
Authorization: Bearer <Kiosk API Key>
Idempotency-Key: <uuid> — Bắt buộc, chống trùng lặp
```

**Request Body:**
```json
{
  "descriptor": "float[], required — Vector khuôn mặt trích xuất từ camera Kiosk",
  "liveness_score": "decimal, required — Điểm liveness detection (0.0 - 1.0)",
  "captured_at": "timestamp, required — Thời điểm chụp trên Kiosk"
}
```

**Response `200 OK` (matched):**
```json
{
  "success": true,
  "data": {
    "verification_log_id": "uuid",
    "result": "matched",
    "confidence_score": 0.95,
    "employee": {
      "id": "uuid",
      "employee_code": "EMP-001",
      "full_name": "Nguyễn Văn A"
    },
    "occurred_at": "2026-08-09T08:00:05Z"
  }
}
```

**Response `200 OK` (no_match / liveness_failed):**
```json
{
  "success": true,
  "data": {
    "verification_log_id": "uuid",
    "result": "no_match | liveness_failed",
    "confidence_score": 0.35,
    "employee": null,
    "retry_remaining": 2,
    "fallback_required": false,
    "occurred_at": "2026-08-09T08:00:05Z"
  }
}
```

**Lỗi:**

| HTTP Code | Error Code | Mô tả |
| :--- | :--- | :--- |
| 409 | `IDEMPOTENCY_KEY_EXISTS` | Yêu cầu đã được xử lý (trả về kết quả cũ) |
| 429 | `MAX_RETRIES_EXCEEDED` | Vượt quá số lần thử, yêu cầu dùng fallback |

**Logic nghiệp vụ:**
1. **Liveness check (FR-BIO-09):** Nếu `liveness_score < threshold` → trả `liveness_failed`, không so khớp.
2. **Idempotency (FR-BIO-11):** Kiểm tra `idempotency_key` unique. Nếu đã tồn tại → trả kết quả cũ (HTTP 409 hoặc 200 với data cũ).
3. **So khớp (FR-BIO-08):** Cosine distance giữa descriptor đầu vào và các `face_embedding_samples` cùng chi nhánh. So với `face_match_threshold` trong `tenant_settings`.
4. **Retry limit (FR-BIO-10):** Đếm số lần thất bại liên tiếp. Khi vượt `max_face_retries` → `fallback_required = true`.
5. Ghi `face_verification_logs`.

---

## 6. Phân hệ 4: Phân ca & Chấm công

> **Tham chiếu SRS:** FR-SHF-01 → FR-SHF-13
> **Bảng CSDL:** `shift_templates`, `shifts`, `attendance_events`, `attendance_fallback_codes`, `daily_attendance_summaries`

---

### 6.1. Shift Templates (Ca mẫu)

#### `GET /api/v1/branches/:branch_id/shift-templates` — Danh sách ca mẫu

> **Traceability:** FR-SHF-01
> **Quyền:** Owner, Manager (chi nhánh), Staff (read-only)

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "branch_id": "uuid",
      "name": "Ca Sáng",
      "start_time": "07:00:00",
      "end_time": "15:00:00",
      "is_overnight": false,
      "break_duration_minutes": 60,
      "allow_late_minutes": 15,
      "allow_early_leave_minutes": 10,
      "created_at": "...",
      "deleted_at": null
    }
  ]
}
```

---

#### `POST /api/v1/branches/:branch_id/shift-templates` — Tạo ca mẫu

> **Traceability:** FR-SHF-01
> **Quyền:** Owner, Manager (chi nhánh)

**Request Body:**
```json
{
  "name": "string, required — Tên ca (VD: 'Ca Sáng', 'Ca Đêm')",
  "start_time": "time, required — Giờ bắt đầu (HH:mm:ss)",
  "end_time": "time, required — Giờ kết thúc (HH:mm:ss)",
  "is_overnight": "boolean, required — Ca qua đêm (end_time < start_time)",
  "break_duration_minutes": "integer, required — Thời gian nghỉ giữa ca (phút)",
  "allow_late_minutes": "integer, optional — Số phút cho phép đi muộn (default: 0)",
  "allow_early_leave_minutes": "integer, optional — Số phút cho phép về sớm (default: 0)"
}
```

---

#### `PUT /api/v1/branches/:branch_id/shift-templates/:template_id` — Cập nhật ca mẫu

> **Traceability:** FR-SHF-01
> **Quyền:** Owner, Manager (chi nhánh)

---

#### `DELETE /api/v1/branches/:branch_id/shift-templates/:template_id` — Xóa mềm ca mẫu

> **Traceability:** FR-SHF-01
> **Quyền:** Owner, Manager (chi nhánh)

---

### 6.2. Shifts (Lịch phân ca)

#### `GET /api/v1/shifts` — Danh sách lịch phân ca

> **Traceability:** FR-SHF-02
> **Quyền:** Owner (tất cả), Manager (chi nhánh), Staff (chỉ ca của mình)

**Query Parameters:**

| Param | Type | Mô tả |
| :--- | :--- | :--- |
| `branch_id` | uuid | Lọc theo chi nhánh |
| `employee_id` | uuid | Lọc theo nhân viên |
| `status` | string | Lọc theo trạng thái ca |
| `date_from` | date | Ngày bắt đầu (YYYY-MM-DD) |
| `date_to` | date | Ngày kết thúc (YYYY-MM-DD) |
| `page` | integer | Trang |
| `page_size` | integer | Số bản ghi/trang |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "branch_id": "uuid",
      "employee_id": "uuid",
      "employee_name": "Nguyễn Văn A",
      "shift_template_id": "uuid | null",
      "shift_template_name": "Ca Sáng | null",
      "start_time": "2026-08-09T07:00:00Z",
      "end_time": "2026-08-09T15:00:00Z",
      "status": "published",
      "confirmed_by": "uuid | null",
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "meta": { ... }
}
```

---

#### `POST /api/v1/shifts` — Tạo lịch phân ca

> **Traceability:** FR-SHF-02
> **Quyền:** Owner, Manager (chi nhánh)

**Request Body:**
```json
{
  "branch_id": "uuid, required",
  "employee_id": "uuid, required",
  "shift_template_id": "uuid, optional — Nếu null thì nhập tay start/end time",
  "start_time": "timestamp, required — Thời gian bắt đầu",
  "end_time": "timestamp, required — Thời gian kết thúc",
  "status": "string, optional — default 'draft'"
}
```

**Validation:**
- Kiểm tra xung đột ca (không trùng thời gian với ca khác của cùng nhân viên trong ngày).
- Nếu `shift_template_id` được cung cấp, tự động lấy thông tin từ ca mẫu.

---

#### `POST /api/v1/shifts/batch` — Tạo lịch phân ca hàng loạt

> **Traceability:** FR-SHF-02
> **Quyền:** Owner, Manager (chi nhánh)

**Request Body:**
```json
{
  "branch_id": "uuid, required",
  "shift_template_id": "uuid, required",
  "employee_ids": ["uuid", "uuid", "..."],
  "date_range": {
    "start_date": "date, required",
    "end_date": "date, required"
  },
  "exclude_dates": ["date", "..."],
  "exclude_weekly_off": "boolean, optional — Loại trừ ngày nghỉ tuần (default: true)"
}
```

---

#### `PATCH /api/v1/shifts/:shift_id/status` — Chuyển trạng thái ca

> **Traceability:** FR-SHF-03, FR-SHF-04
> **Quyền:** Owner, Manager (chi nhánh) cho publish/cancel. Staff cho confirm/change_request.

**Request Body:**
```json
{
  "status": "string, required — Trạng thái đích",
  "reason": "string, optional — Lý do (bắt buộc khi change_requested hoặc cancelled)"
}
```

**State Machine hợp lệ (FR-SHF-03):**
```
draft → published → confirmed | change_requested → in_progress → completed
                                                                  cancelled (trước in_progress)
```

**Lỗi:**

| HTTP Code | Error Code | Mô tả |
| :--- | :--- | :--- |
| 422 | `INVALID_STATUS_TRANSITION` | Chuyển trạng thái không hợp lệ |
| 403 | `STAFF_CANNOT_PUBLISH` | Staff không được phép publish ca |

---

### 6.3. Attendance Events (Sự kiện chấm công)

#### `POST /api/v1/attendance-events` — Ghi nhận sự kiện chấm công

> **Traceability:** FR-SHF-05, FR-SHF-06, FR-SHF-09
> **Quyền:** Kiosk Device, Staff (mobile), Manager (điều chỉnh)
> **SLA:** Hoàn tất ≤ 1 giây (NFR Performance)

**Headers:**
```
Idempotency-Key: <uuid> — Bắt buộc
```

**Request Body:**
```json
{
  "employee_id": "uuid, required",
  "branch_id": "uuid, required",
  "shift_id": "uuid, optional — null nếu chấm công ngoài lịch phân ca",
  "verification_log_id": "uuid, optional — ID log xác thực khuôn mặt (nếu chấm qua Kiosk)",
  "event_type": "string, required — 'check_in' | 'check_out' | 'break_start' | 'break_end' | 'manager_adjust'",
  "method": "string, required — 'face_id' | 'qr_fallback' | 'pin_fallback'",
  "location": {
    "latitude": "decimal, optional",
    "longitude": "decimal, optional"
  },
  "payload": "object, optional — Dữ liệu bổ sung (adjust_reason cho manager_adjust)",
  "occurred_at": "timestamp, required — Thời điểm quẹt thực tế trên Kiosk"
}
```

**Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employee_id": "uuid",
    "event_type": "check_in",
    "method": "face_id",
    "occurred_at": "2026-08-09T07:02:00Z",
    "recorded_at": "2026-08-09T07:02:01Z",
    "shift_id": "uuid",
    "idempotency_key": "uuid"
  }
}
```

**Lỗi:**

| HTTP Code | Error Code | Mô tả |
| :--- | :--- | :--- |
| 409 | `IDEMPOTENCY_KEY_EXISTS` | Sự kiện đã được ghi nhận (trả kết quả cũ) |
| 422 | `EMPLOYEE_NOT_ACTIVE` | Nhân viên không ở trạng thái active |

**Side Effects:**
- Đẩy event vào Redis BullMQ Queue `attendance-processing` để Worker tổng hợp công.
- Sinh `audit_logs` cho `event_type = manager_adjust`.

---

#### `POST /api/v1/attendance-events/batch-sync` — Đồng bộ hàng loạt từ Kiosk offline

> **Traceability:** FR-SHF-05 (Offline sync)
> **Quyền:** Kiosk Device (API Key)

**Request Body:**
```json
{
  "events": [
    {
      "employee_id": "uuid",
      "branch_id": "uuid",
      "shift_id": "uuid | null",
      "verification_log_id": "uuid | null",
      "event_type": "string",
      "method": "string",
      "location": { "latitude": 0, "longitude": 0 },
      "payload": {},
      "occurred_at": "timestamp",
      "idempotency_key": "uuid"
    }
  ]
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "total_received": 15,
    "created": 12,
    "duplicates_skipped": 3,
    "errors": []
  }
}
```

---

#### `GET /api/v1/attendance-events` — Danh sách sự kiện chấm công

> **Traceability:** FR-SHF-05
> **Quyền:** Owner, Manager (chi nhánh), Staff (chỉ bản thân)

**Query Parameters:**

| Param | Type | Mô tả |
| :--- | :--- | :--- |
| `employee_id` | uuid | Lọc theo nhân viên |
| `branch_id` | uuid | Lọc theo chi nhánh |
| `date_from` | date | Ngày bắt đầu |
| `date_to` | date | Ngày kết thúc |
| `event_type` | string | Lọc theo loại sự kiện |

---

### 6.4. Attendance Fallback Codes (Mã dự phòng)

#### `POST /api/v1/employees/:employee_id/fallback-codes` — Sinh mã dự phòng

> **Traceability:** FR-SHF-07, FR-SHF-08
> **Quyền:** Owner, Manager (chi nhánh)

**Request Body:**
```json
{
  "type": "string, required — 'pin' | 'qr'",
  "expires_in_hours": "integer, optional — Thời hạn (default: 24 giờ)"
}
```

**Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employee_id": "uuid",
    "code": "123456",
    "type": "pin",
    "expires_at": "2026-08-10T07:00:00Z",
    "used_at": null
  }
}
```

---

#### `POST /api/v1/attendance-events/verify-fallback` — Xác thực mã dự phòng

> **Traceability:** FR-SHF-07
> **Quyền:** Kiosk Device (API Key)

**Request Body:**
```json
{
  "employee_id": "uuid, required",
  "code": "string, required — Mã PIN hoặc QR",
  "kiosk_id": "uuid, required"
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "verified": true,
    "employee": {
      "id": "uuid",
      "employee_code": "EMP-001",
      "full_name": "Nguyễn Văn A"
    }
  }
}
```

**Lỗi:**

| HTTP Code | Error Code | Mô tả |
| :--- | :--- | :--- |
| 401 | `INVALID_FALLBACK_CODE` | Mã không đúng |
| 410 | `FALLBACK_CODE_EXPIRED` | Mã đã hết hạn |
| 410 | `FALLBACK_CODE_USED` | Mã đã được sử dụng |

**Logic:** Kiểm tra `expires_at > NOW()` và `used_at IS NULL`. Nếu hợp lệ → gán `used_at = NOW()`.

---

### 6.5. Daily Attendance Summaries (Bảng tổng hợp công)

#### `GET /api/v1/attendance-summaries` — Bảng tổng hợp công theo ngày

> **Traceability:** FR-SHF-11, FR-SHF-13
> **Quyền:** Owner, Manager (chi nhánh), Accountant, Staff (chỉ bản thân)

**Query Parameters:**

| Param | Type | Mô tả |
| :--- | :--- | :--- |
| `branch_id` | uuid | Lọc theo chi nhánh (bắt buộc cho Manager) |
| `employee_id` | uuid | Lọc theo nhân viên |
| `date_from` | date | Ngày bắt đầu |
| `date_to` | date | Ngày kết thúc |
| `status` | string | Lọc theo trạng thái: `present`, `absent`, `late`, `leave`, `holiday`, `off` |
| `page` | integer | Trang |
| `page_size` | integer | Số bản ghi/trang |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "branch_id": "uuid",
      "employee_id": "uuid",
      "employee_name": "Nguyễn Văn A",
      "employee_code": "EMP-001",
      "shift_id": "uuid | null",
      "date": "2026-08-09",
      "first_check_in": "2026-08-09T07:02:00Z",
      "last_check_out": "2026-08-09T15:05:00Z",
      "actual_work_hours": 7.95,
      "late_minutes": 2,
      "early_leave_minutes": 0,
      "overtime_hours": 0.08,
      "status": "present",
      "rebuilt_at": "2026-08-09T15:10:00Z"
    }
  ],
  "meta": { ... }
}
```

---

#### `POST /api/v1/attendance-summaries/rebuild` — Kích hoạt tính lại công

> **Traceability:** FR-SHF-12
> **Quyền:** Owner, Manager (chi nhánh)

**Request Body:**
```json
{
  "branch_id": "uuid, optional — Tính lại toàn chi nhánh",
  "employee_id": "uuid, optional — Tính lại cho nhân viên cụ thể",
  "date_from": "date, required",
  "date_to": "date, required"
}
```

**Response `202 Accepted`:**
```json
{
  "success": true,
  "data": {
    "message": "Đã đưa vào hàng đợi tính lại công",
    "job_id": "uuid",
    "estimated_records": 150
  }
}
```

**Logic:** Đẩy job vào Redis BullMQ Queue `attendance-processing`. Worker sẽ tính lại `daily_attendance_summaries` với `rebuilt_at = NOW()`.

---

## 7. Phân hệ 5: Quản lý Nghỉ phép

> **Tham chiếu SRS:** FR-LEA-01 → FR-LEA-08
> **Bảng CSDL:** `leave_requests`, `employee_leave_balances`

---

### 7.1. Leave Requests (Đơn nghỉ phép)

#### `GET /api/v1/leave-requests` — Danh sách đơn nghỉ phép

> **Traceability:** FR-LEA-01
> **Quyền:** Owner (tất cả), Manager (chi nhánh), Staff (chỉ bản thân)

**Query Parameters:**

| Param | Type | Mô tả |
| :--- | :--- | :--- |
| `branch_id` | uuid | Lọc theo chi nhánh |
| `employee_id` | uuid | Lọc theo nhân viên |
| `status` | string | `draft`, `pending`, `approved`, `rejected`, `locked` |
| `category` | string | `annual`, `sick`, `maternity`, `unpaid`, `other` |
| `date_from` | date | Ngày bắt đầu nghỉ |
| `date_to` | date | Ngày kết thúc nghỉ |
| `page` | integer | Trang |
| `page_size` | integer | Số bản ghi/trang |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "branch_id": "uuid",
      "employee_id": "uuid",
      "employee_name": "Nguyễn Văn A",
      "employee_code": "EMP-001",
      "category": "annual",
      "is_paid": true,
      "start_date": "2026-08-11",
      "end_date": "2026-08-12",
      "duration_days": 2.0,
      "status": "pending",
      "reason": "Việc gia đình",
      "approved_by": null,
      "created_at": "2026-08-09T10:00:00Z",
      "updated_at": "2026-08-09T10:00:00Z"
    }
  ],
  "meta": { ... }
}
```

---

#### `POST /api/v1/leave-requests` — Tạo đơn xin nghỉ phép

> **Traceability:** FR-LEA-01, FR-LEA-03, FR-LEA-04, FR-LEA-08
> **Quyền:** Staff (bản thân), Manager (cho nhân viên chi nhánh), Owner

**Request Body:**
```json
{
  "employee_id": "uuid, required — (Staff chỉ được tạo cho bản thân)",
  "category": "string, required — 'annual' | 'sick' | 'maternity' | 'unpaid' | 'other'",
  "is_paid": "boolean, required — Nghỉ có lương hay không",
  "start_date": "date, required — Ngày bắt đầu nghỉ (YYYY-MM-DD)",
  "end_date": "date, required — Ngày kết thúc nghỉ (YYYY-MM-DD)",
  "duration_days": "decimal, required — Số ngày nghỉ (hỗ trợ 0.5)",
  "reason": "string, required — Lý do xin nghỉ",
  "status": "string, optional — 'draft' | 'pending' (default: 'pending')"
}
```

**Response `201 Created`:** Trả về object đơn nghỉ phép.

**Lỗi:**

| HTTP Code | Error Code | Mô tả |
| :--- | :--- | :--- |
| 422 | `INSUFFICIENT_LEAVE_BALANCE` | Quỹ phép còn lại không đủ (remaining_days < duration_days) |
| 409 | `LEAVE_DATE_OVERLAP` | Trùng khoảng ngày với đơn nghỉ khác đang pending/approved |
| 422 | `INVALID_DATE_RANGE` | end_date < start_date hoặc duration_days không khớp |

**Logic nghiệp vụ:**
1. **(FR-LEA-08)** Kiểm tra chồng lấn: không cho tạo nếu trùng ngày với đơn `pending`/`approved`.
2. **(FR-LEA-03)** Nếu `category = annual` và `is_paid = true`: kiểm tra `remaining_days >= duration_days` trong `employee_leave_balances`.
3. **(FR-LEA-04)** Khi `status = pending`: tăng `pending_days` trong `employee_leave_balances`.
4. Gửi notification `leave_submitted` cho Manager chi nhánh.

---

#### `GET /api/v1/leave-requests/:leave_id` — Chi tiết đơn nghỉ phép

> **Quyền:** Owner, Manager (chi nhánh), Staff (bản thân)

---

#### `PUT /api/v1/leave-requests/:leave_id` — Cập nhật đơn nghỉ phép

> **Quyền:** Staff (chỉ đơn draft/pending của mình), Manager, Owner

**Validation:** Không cho sửa đơn ở trạng thái `approved`, `rejected`, `locked`.

---

#### `PATCH /api/v1/leave-requests/:leave_id/approve` — Duyệt đơn nghỉ phép

> **Traceability:** FR-LEA-02, FR-LEA-04, FR-LEA-07
> **Quyền:** Manager (chi nhánh), Owner

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "approved",
    "approved_by": "uuid",
    "updated_at": "..."
  }
}
```

**Logic:**
1. Đổi `status = approved`, ghi `approved_by`.
2. **(FR-LEA-04)** Cập nhật `employee_leave_balances`: giảm `pending_days`, tăng `used_days`, tính lại `remaining_days`.
3. **(FR-LEA-07)** Kích hoạt rebuild `daily_attendance_summaries` cho các ngày nghỉ → `status = leave`.
4. Gửi notification `leave_approved` cho nhân viên.

---

#### `PATCH /api/v1/leave-requests/:leave_id/reject` — Từ chối đơn nghỉ phép

> **Traceability:** FR-LEA-02, FR-LEA-04
> **Quyền:** Manager (chi nhánh), Owner

**Request Body:**
```json
{
  "reject_reason": "string, optional — Lý do từ chối"
}
```

**Logic:**
1. Đổi `status = rejected`.
2. **(FR-LEA-04)** Hoàn lại `pending_days` trong `employee_leave_balances`.
3. Gửi notification `leave_rejected` cho nhân viên.

---

### 7.2. Leave Balances (Quỹ phép)

#### `GET /api/v1/employees/:employee_id/leave-balances` — Quỹ phép nhân viên

> **Traceability:** FR-LEA-05
> **Quyền:** Owner, Manager (chi nhánh), Accountant, Staff (bản thân)

**Query Parameters:**

| Param | Type | Mô tả |
| :--- | :--- | :--- |
| `year` | integer | Năm (default: năm hiện tại) |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employee_id": "uuid",
    "year": 2026,
    "total_accrued": 12.0,
    "used_days": 3.0,
    "pending_days": 2.0,
    "remaining_days": 7.0,
    "updated_at": "2026-08-09T10:00:00Z"
  }
}
```

---

#### `PUT /api/v1/employees/:employee_id/leave-balances` — Cập nhật quỹ phép thủ công

> **Traceability:** FR-LEA-06
> **Quyền:** Owner, Accountant

**Request Body:**
```json
{
  "year": "integer, required",
  "total_accrued": "decimal, required — Tổng ngày phép cộng dồn"
}
```

**Logic:** Chỉ cho phép cập nhật `total_accrued`. Hệ thống tự tính lại `remaining_days`.

---

#### `POST /api/v1/leave-balances/initialize` — Khởi tạo quỹ phép đầu năm

> **Traceability:** FR-LEA-06
> **Quyền:** Owner, System Admin (hoặc chạy tự động bởi Cron Job)

**Request Body:**
```json
{
  "year": "integer, required — Năm khởi tạo",
  "branch_id": "uuid, optional — Chi nhánh cụ thể (null = toàn Tenant)",
  "default_total_accrued": "decimal, required — Số ngày phép mặc định"
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "created_count": 120,
    "skipped_count": 5,
    "year": 2027
  }
}
```

---

## 8. Phân hệ 6: Tính Lương

> **Tham chiếu SRS:** FR-PAY-01 → FR-PAY-11
> **Bảng CSDL:** `payroll_policies`, `payroll_records`, `payroll_line_items`, `payroll_disputes`, `payroll_adjustments`

---

### 8.1. Payroll Policies (Chính sách lương/phạt)

#### `GET /api/v1/payroll-policies` — Danh sách chính sách

> **Traceability:** FR-PAY-01
> **Quyền:** Owner, Accountant

**Query Parameters:**

| Param | Type | Mô tả |
| :--- | :--- | :--- |
| `type` | string | Lọc theo loại: `ot_multiplier_weekday`, `ot_multiplier_weekend`, `late_penalty_per_minute`, `early_leave_penalty_per_minute`, ... |
| `active_only` | boolean | Chỉ chính sách đang hiệu lực (effective_to = null hoặc > NOW()) |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "type": "ot_multiplier_weekday",
      "rate": 1.5,
      "effective_from": "2026-01-01",
      "effective_to": null,
      "created_at": "..."
    },
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "type": "late_penalty_per_minute",
      "rate": 5000,
      "effective_from": "2026-01-01",
      "effective_to": null,
      "created_at": "..."
    }
  ]
}
```

---

#### `POST /api/v1/payroll-policies` — Tạo chính sách mới

> **Traceability:** FR-PAY-01
> **Quyền:** Owner, Accountant

**Request Body:**
```json
{
  "type": "string, required — Loại chính sách",
  "rate": "decimal, required — Hệ số/tỷ lệ",
  "effective_from": "date, required — Ngày bắt đầu hiệu lực",
  "effective_to": "date, optional — Ngày kết thúc hiệu lực (null = vô thời hạn)"
}
```

---

#### `PUT /api/v1/payroll-policies/:policy_id` — Cập nhật chính sách

> **Traceability:** FR-PAY-01
> **Quyền:** Owner, Accountant

---

### 8.2. Payroll Records (Phiếu lương)

#### `GET /api/v1/payroll-records` — Danh sách phiếu lương

> **Traceability:** FR-PAY-02
> **Quyền:** Owner (tất cả), Manager (chi nhánh, tùy cấu hình), Accountant, Staff (chỉ phiếu của mình)

**Query Parameters:**

| Param | Type | Mô tả |
| :--- | :--- | :--- |
| `branch_id` | uuid | Lọc theo chi nhánh |
| `employee_id` | uuid | Lọc theo nhân viên |
| `period` | string | Kỳ lương (VD: `2026-07`) |
| `status` | string | `draft`, `pending_review`, `reviewed`, `locked` |
| `page` | integer | Trang |
| `page_size` | integer | Số bản ghi/trang |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "branch_id": "uuid",
      "employee_id": "uuid",
      "employee_name": "Nguyễn Văn A",
      "employee_code": "EMP-001",
      "period": "2026-07",
      "status": "pending_review",
      "gross_amount": 15500000,
      "social_insurance_amount": 1550000,
      "tax_amount": 500000,
      "total_deductions": 2050000,
      "net_amount": 13450000,
      "currency": "VND",
      "created_by": "uuid",
      "reviewed_by": null,
      "locked_by": null,
      "created_at": "2026-08-01T10:00:00Z",
      "updated_at": "2026-08-01T10:00:00Z"
    }
  ],
  "meta": { ... }
}
```

---

#### `POST /api/v1/payroll-records/generate` — Khởi tạo bảng lương theo kỳ

> **Traceability:** FR-PAY-02, FR-PAY-03, FR-PAY-04, FR-PAY-05
> **Quyền:** Accountant, Owner

**Request Body:**
```json
{
  "period": "string, required — Kỳ lương (VD: '2026-07')",
  "branch_id": "uuid, optional — Chi nhánh cụ thể (null = toàn Tenant)"
}
```

**Response `202 Accepted`:**
```json
{
  "success": true,
  "data": {
    "message": "Đã đưa vào hàng đợi tính lương",
    "job_id": "uuid",
    "period": "2026-07",
    "estimated_employees": 120
  }
}
```

**Logic nghiệp vụ (chạy trong Payroll Worker):**
1. Lặp qua từng nhân viên `active` trong phạm vi.
2. **(FR-PAY-02)** Đọc `employee_compensation_history` (rate, pay_basis), `daily_attendance_summaries` trong kỳ, `payroll_policies`.
3. **(FR-PAY-03)** Tính từng khoản → tạo `payroll_line_items`:
   - `base_salary`: Lương cơ bản theo pay_basis
   - `bonus`: Thưởng (nếu có)
   - `penalty`: Phạt đi muộn/về sớm
   - `allowance`: Phụ cấp
   - `unused_leave_payout`: Thanh toán ngày phép chưa dùng (nếu có)
4. **(FR-PAY-04)** Tính `social_insurance_amount`, `tax_amount`.
5. **(FR-PAY-05)** `net_amount = gross_amount - total_deductions`.
6. Tạo `payroll_records` với `status = draft`, sau đó chuyển `pending_review`.
7. Ghi `created_by`.
8. Gửi notification `payroll_pending_review`.

---

#### `GET /api/v1/payroll-records/:payroll_id` — Chi tiết phiếu lương

> **Quyền:** Owner, Manager (tùy cấu hình), Accountant, Staff (bản thân)

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "employee_name": "Nguyễn Văn A",
    "period": "2026-07",
    "status": "pending_review",
    "gross_amount": 15500000,
    "social_insurance_amount": 1550000,
    "tax_amount": 500000,
    "total_deductions": 2050000,
    "net_amount": 13450000,
    "currency": "VND",
    "line_items": [
      { "id": "uuid", "item_type": "base_salary", "amount": 15000000, "note": "Lương tháng 07/2026" },
      { "id": "uuid", "item_type": "bonus", "amount": 1000000, "note": "OT x1.5: 4h" },
      { "id": "uuid", "item_type": "penalty", "amount": -500000, "note": "Đi muộn 30 phút x 5 ngày" }
    ],
    "created_by_name": "Kế toán Trần B",
    "reviewed_by_name": null,
    "locked_by_name": null,
    "disputes": [],
    "adjustments": []
  }
}
```

---

#### `PATCH /api/v1/payroll-records/:payroll_id/status` — Chuyển trạng thái phiếu lương

> **Traceability:** FR-PAY-06, FR-PAY-07
> **Quyền:** Accountant (pending_review, lock), Manager/Owner (review)

**Request Body:**
```json
{
  "status": "string, required — 'pending_review' | 'reviewed' | 'locked'"
}
```

**State Machine (FR-PAY-06):**
```
draft → pending_review → reviewed → locked
```

**Logic (FR-PAY-07 — Segregation of Duties):**
- Ghi nhận `reviewed_by` khi chuyển sang `reviewed`.
- Ghi nhận `locked_by` khi chuyển sang `locked`.
- Hệ thống cảnh báo nếu `created_by == locked_by` (tùy chính sách Tenant).
- Khi `locked`: khóa vĩnh viễn, không cho sửa trực tiếp (FR-PAY-10).

**Lỗi:**

| HTTP Code | Error Code | Mô tả |
| :--- | :--- | :--- |
| 422 | `INVALID_STATUS_TRANSITION` | Chuyển trạng thái không hợp lệ |
| 422 | `SOD_VIOLATION_WARNING` | Cùng người tạo và chốt lương (cảnh báo SoD) |
| 422 | `UNRESOLVED_DISPUTES` | Còn khiếu nại chưa xử lý |

---

### 8.3. Payroll Disputes (Khiếu nại lương)

#### `GET /api/v1/payroll-records/:payroll_id/disputes` — Danh sách khiếu nại

> **Traceability:** FR-PAY-08
> **Quyền:** Owner, Manager, Accountant, Staff (bản thân)

---

#### `POST /api/v1/payroll-records/:payroll_id/disputes` — Tạo khiếu nại

> **Traceability:** FR-PAY-08
> **Quyền:** Staff (phiếu lương bản thân), Manager

**Request Body:**
```json
{
  "reason": "string, required — Lý do khiếu nại"
}
```

**Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "payroll_record_id": "uuid",
    "raised_by": "uuid",
    "reason": "Thiếu tính OT ngày 15/07",
    "status": "open",
    "resolved_by": null,
    "created_at": "...",
    "resolved_at": null
  }
}
```

---

#### `PATCH /api/v1/payroll-disputes/:dispute_id/resolve` — Giải quyết khiếu nại

> **Traceability:** FR-PAY-08
> **Quyền:** Accountant, Owner

**Request Body:**
```json
{
  "status": "string, required — 'resolved' | 'rejected'",
  "resolution_note": "string, optional — Ghi chú giải quyết"
}
```

**Logic:** Ghi `resolved_by`, `resolved_at`.

---

### 8.4. Payroll Adjustments (Điều chỉnh lương)

#### `POST /api/v1/payroll-records/:payroll_id/adjustments` — Điều chỉnh lương thủ công

> **Traceability:** FR-PAY-09, FR-PAY-10
> **Quyền:** Accountant, Owner

**Request Body:**
```json
{
  "reason": "string, required — Lý do điều chỉnh",
  "line_item_changes": [
    {
      "line_item_id": "uuid, optional — ID khoản cần sửa (null nếu thêm mới)",
      "item_type": "string, required",
      "amount": "decimal, required",
      "note": "string, required"
    }
  ]
}
```

**Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "payroll_record_id": "uuid",
    "adjusted_by": "uuid",
    "reason": "Bổ sung OT ngày 15/07",
    "before_snapshot": { "gross_amount": 15500000, "net_amount": 13450000, "line_items": [...] },
    "after_snapshot": { "gross_amount": 16000000, "net_amount": 13900000, "line_items": [...] },
    "created_at": "..."
  }
}
```

**Logic (FR-PAY-09):**
1. Lưu `before_snapshot` (JSON chụp lại trạng thái hiện tại: gross, net, line_items).
2. Áp dụng thay đổi line_items.
3. Tính lại `gross_amount`, `total_deductions`, `net_amount`.
4. Lưu `after_snapshot`.
5. Sinh `audit_logs`.

**Validation (FR-PAY-10):** Nếu payroll ở trạng thái `locked`, chỉ cho phép điều chỉnh qua endpoint này (không cho sửa trực tiếp line items).

---

#### `GET /api/v1/payroll-records/:payroll_id/adjustments` — Lịch sử điều chỉnh

> **Quyền:** Owner, Accountant

---

## 9. Phân hệ 7: Hệ thống, Thông báo & Kiểm toán

> **Tham chiếu SRS:** FR-SYS-01 → FR-SYS-09
> **Bảng CSDL:** `export_jobs`, `notifications`, `audit_logs`

---

### 9.1. Export Jobs (Xuất báo cáo)

#### `POST /api/v1/export-jobs` — Yêu cầu xuất báo cáo

> **Traceability:** FR-SYS-01, FR-SYS-02
> **Quyền:** Owner, Manager (chi nhánh), Accountant

**Request Body:**
```json
{
  "export_type": "string, required — 'payroll' | 'attendance'",
  "filters": {
    "period": "string, optional — Kỳ lương (VD: '2026-07')",
    "branch_id": "uuid, optional",
    "department_id": "uuid, optional",
    "date_from": "date, optional",
    "date_to": "date, optional"
  },
  "format": "string, optional — 'excel' | 'pdf' (default: 'excel')"
}
```

**Response `202 Accepted`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "export_type": "payroll",
    "status": "pending",
    "created_at": "2026-08-09T10:00:00Z",
    "estimated_completion": "2026-08-09T10:02:00Z"
  }
}
```

**Logic (FR-SYS-02):**
1. Tạo `export_jobs` với `status = pending`.
2. Đẩy job vào Redis BullMQ Queue `export-jobs`.
3. Worker xử lý: `pending → processing → completed/failed`.
4. Upload file lên S3, lưu `file_url` (signed URL có thời hạn).
5. **(FR-SYS-03)** Gửi notification `export_completed` cho `requested_by`.

---

#### `GET /api/v1/export-jobs` — Danh sách tác vụ xuất báo cáo

> **Traceability:** FR-SYS-01
> **Quyền:** Owner, Manager, Accountant

**Query Parameters:**

| Param | Type | Mô tả |
| :--- | :--- | :--- |
| `status` | string | `pending`, `processing`, `completed`, `failed` |
| `export_type` | string | `payroll`, `attendance` |

---

#### `GET /api/v1/export-jobs/:job_id` — Chi tiết tác vụ xuất

> **Quyền:** Người tạo hoặc Owner

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "export_type": "payroll",
    "filters": { "period": "2026-07", "branch_id": "uuid" },
    "status": "completed",
    "file_url": "https://s3.../payroll-2026-07.xlsx?signed=...",
    "created_at": "2026-08-09T10:00:00Z",
    "completed_at": "2026-08-09T10:01:30Z"
  }
}
```

---

### 9.2. Notifications (Thông báo)

#### `GET /api/v1/notifications` — Danh sách thông báo của người dùng hiện tại

> **Traceability:** FR-SYS-04, FR-SYS-05, FR-SYS-06
> **Quyền:** Authenticated (mọi vai trò — chỉ xem thông báo của mình)

**Query Parameters:**

| Param | Type | Mô tả |
| :--- | :--- | :--- |
| `unread_only` | boolean | Chỉ thông báo chưa đọc (default: false) |
| `type` | string | Lọc theo loại notification |
| `page` | integer | Trang |
| `page_size` | integer | Số bản ghi/trang |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "leave_approved",
      "title": "Đơn nghỉ phép đã được duyệt",
      "body": "Đơn nghỉ phép ngày 11-12/08/2026 đã được Quản lý Trần B duyệt",
      "related_entity_id": "uuid — ID đơn nghỉ phép",
      "read_at": null,
      "created_at": "2026-08-09T10:30:00Z"
    }
  ],
  "meta": { ... }
}
```

---

#### `PATCH /api/v1/notifications/:notification_id/read` — Đánh dấu đã đọc

> **Traceability:** FR-SYS-05
> **Quyền:** Authenticated (chỉ thông báo của mình)

**Response `200 OK`:**
```json
{
  "success": true,
  "data": { "id": "uuid", "read_at": "2026-08-09T10:35:00Z" }
}
```

---

#### `PATCH /api/v1/notifications/read-all` — Đánh dấu tất cả đã đọc

> **Traceability:** FR-SYS-05
> **Quyền:** Authenticated

**Response `200 OK`:**
```json
{
  "success": true,
  "data": { "updated_count": 15 }
}
```

---

#### `GET /api/v1/notifications/unread-count` — Số thông báo chưa đọc

> **Quyền:** Authenticated

**Response `200 OK`:**
```json
{
  "success": true,
  "data": { "unread_count": 5 }
}
```

---

### 9.3. Audit Logs (Nhật ký kiểm toán)

#### `GET /api/v1/audit-logs` — Tra cứu nhật ký kiểm toán

> **Traceability:** FR-SYS-07, FR-SYS-08, FR-SYS-09
> **Quyền:** Owner (toàn Tenant), Manager (chi nhánh — giới hạn), Accountant (liên quan lương)

**Query Parameters:**

| Param | Type | Mô tả |
| :--- | :--- | :--- |
| `target_table` | string | Tên bảng đối tượng (VD: `employees`, `payroll_records`) |
| `target_id` | uuid | ID bản ghi cụ thể |
| `actor_id` | uuid | ID người thực hiện |
| `action` | string | `create`, `update`, `delete` |
| `date_from` | datetime | Thời gian bắt đầu |
| `date_to` | datetime | Thời gian kết thúc |
| `page` | integer | Trang |
| `page_size` | integer | Số bản ghi/trang |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "actor_id": "uuid",
      "actor_name": "Kế toán Trần B",
      "actor_email": "tranb@abc.com",
      "action": "update",
      "target_table": "payroll_records",
      "target_id": "uuid",
      "old_values": { "status": "pending_review", "net_amount": 13450000 },
      "new_values": { "status": "reviewed", "net_amount": 13450000 },
      "created_at": "2026-08-09T11:00:00Z"
    }
  ],
  "meta": { ... }
}
```

> **Lưu ý (FR-SYS-09):** Audit logs là **append-only**. Không có endpoint PUT/DELETE cho audit_logs. Mọi thao tác ghi chỉ diễn ra tự động bởi hệ thống.

---

## Phụ lục A — Mã lỗi HTTP chuẩn

| HTTP Code | Ý nghĩa | Sử dụng khi |
| :--- | :--- | :--- |
| `200` | OK | Thao tác thành công (GET, PUT, PATCH, DELETE) |
| `201` | Created | Tạo mới thành công (POST) |
| `202` | Accepted | Yêu cầu đã nhận, đang xử lý bất đồng bộ |
| `400` | Bad Request | Request body sai format JSON |
| `401` | Unauthorized | Token không hợp lệ / hết hạn / thiếu |
| `403` | Forbidden | Không đủ quyền truy cập resource |
| `404` | Not Found | Resource không tồn tại (trong phạm vi Tenant) |
| `409` | Conflict | Trùng lặp dữ liệu (email, employee_code, idempotency_key) |
| `410` | Gone | Resource đã hết hiệu lực (VD: fallback code expired) |
| `422` | Unprocessable Entity | Dữ liệu hợp lệ về format nhưng vi phạm logic nghiệp vụ |
| `429` | Too Many Requests | Vượt quá Rate Limit |
| `500` | Internal Server Error | Lỗi hệ thống nội bộ |

---

## Phụ lục B — Ma trận Quyền API theo Vai trò

| API Group | Owner | Manager | Accountant | Staff | Kiosk Device |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | ✅ | ✅ | ✅ | ✅ | ✅ (API Key) |
| **Tenant Settings** | CRUD | ❌ | ❌ | ❌ | ❌ |
| **Branches** | CRUD | R (chi nhánh) | R | R (chi nhánh mình) | ❌ |
| **Departments** | CRUD | CRU (chi nhánh) | R | R | ❌ |
| **Holidays** | CRUD | R | R | R | ❌ |
| **Employees** | CRUD | CRU (chi nhánh) | R | R (bản thân) | ❌ |
| **Compensation** | CR | R (chi nhánh) | CR | ❌ | ❌ |
| **Users** | CRUD | CR (staff) | ❌ | ❌ | ❌ |
| **User Roles** | CRUD | R | ❌ | ❌ | ❌ |
| **Biometric Consents** | CRU | CRU (chi nhánh) | ❌ | CU (bản thân) | ❌ |
| **Face Samples** | CRD | CR (chi nhánh) | ❌ | ❌ | ❌ |
| **Kiosks** | CRUD | CRU (chi nhánh) | ❌ | ❌ | Heartbeat |
| **Face Verification** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Shift Templates** | CRUD | CRUD (chi nhánh) | ❌ | R | ❌ |
| **Shifts** | CRUD | CRUD (chi nhánh) | R | R + Confirm | ❌ |
| **Attendance Events** | R | CRU (chi nhánh) | R | R (bản thân) | C |
| **Fallback Codes** | CR | CR (chi nhánh) | ❌ | ❌ | Verify |
| **Attendance Summaries** | R | R (chi nhánh) | R | R (bản thân) | ❌ |
| **Payroll Policies** | CRUD | R (tùy cấu hình) | CRUD | ❌ | ❌ |
| **Payroll Records** | R + Review | R (tùy cấu hình) | CRUD + Lock | R (bản thân) | ❌ |
| **Payroll Disputes** | R | CR | R + Resolve | C (bản thân) | ❌ |
| **Payroll Adjustments** | CR | ❌ | CR | ❌ | ❌ |
| **Export Jobs** | CRUD | CR (chi nhánh) | CR | ❌ | ❌ |
| **Notifications** | R | R | R | R | ❌ |
| **Audit Logs** | R (toàn Tenant) | R (chi nhánh) | R (lương) | ❌ | ❌ |

> **Ghi chú:** C=Create, R=Read, U=Update, D=Delete. "Chi nhánh" = chỉ trong phạm vi chi nhánh được gán role.

---

## Phụ lục C — Tổng hợp Endpoints

| # | Method | Endpoint | Phân hệ |
| :--- | :--- | :--- | :--- |
| 1 | POST | `/api/v1/auth/register` | Auth |
| 2 | POST | `/api/v1/auth/login` | Auth |
| 3 | POST | `/api/v1/auth/refresh` | Auth |
| 4 | POST | `/api/v1/auth/logout` | Auth |
| 5 | GET | `/api/v1/tenants/settings` | Tổ chức |
| 6 | PUT | `/api/v1/tenants/settings` | Tổ chức |
| 7 | GET | `/api/v1/branches` | Tổ chức |
| 8 | POST | `/api/v1/branches` | Tổ chức |
| 9 | GET | `/api/v1/branches/:branch_id` | Tổ chức |
| 10 | PUT | `/api/v1/branches/:branch_id` | Tổ chức |
| 11 | DELETE | `/api/v1/branches/:branch_id` | Tổ chức |
| 12 | GET | `/api/v1/branches/:branch_id/departments` | Tổ chức |
| 13 | POST | `/api/v1/branches/:branch_id/departments` | Tổ chức |
| 14 | PUT | `/api/v1/branches/:branch_id/departments/:department_id` | Tổ chức |
| 15 | DELETE | `/api/v1/branches/:branch_id/departments/:department_id` | Tổ chức |
| 16 | GET | `/api/v1/holidays` | Tổ chức |
| 17 | POST | `/api/v1/holidays` | Tổ chức |
| 18 | PUT | `/api/v1/holidays/:holiday_id` | Tổ chức |
| 19 | DELETE | `/api/v1/holidays/:holiday_id` | Tổ chức |
| 20 | GET | `/api/v1/employees` | Nhân sự |
| 21 | POST | `/api/v1/employees` | Nhân sự |
| 22 | GET | `/api/v1/employees/:employee_id` | Nhân sự |
| 23 | PUT | `/api/v1/employees/:employee_id` | Nhân sự |
| 24 | DELETE | `/api/v1/employees/:employee_id` | Nhân sự |
| 25 | GET | `/api/v1/employees/:employee_id/compensation-history` | Nhân sự |
| 26 | POST | `/api/v1/employees/:employee_id/compensation-history` | Nhân sự |
| 27 | POST | `/api/v1/users` | Nhân sự |
| 28 | DELETE | `/api/v1/users/:user_id` | Nhân sự |
| 29 | GET | `/api/v1/users/:user_id/roles` | Nhân sự |
| 30 | POST | `/api/v1/users/:user_id/roles` | Nhân sự |
| 31 | DELETE | `/api/v1/users/:user_id/roles/:role_id` | Nhân sự |
| 32 | POST | `/api/v1/employees/:employee_id/biometric-consents` | Sinh trắc học |
| 33 | POST | `/api/v1/employees/:employee_id/biometric-consents/:consent_id/revoke` | Sinh trắc học |
| 34 | POST | `/api/v1/employees/:employee_id/face-samples` | Sinh trắc học |
| 35 | GET | `/api/v1/employees/:employee_id/face-samples` | Sinh trắc học |
| 36 | DELETE | `/api/v1/employees/:employee_id/face-samples` | Sinh trắc học |
| 37 | GET | `/api/v1/branches/:branch_id/kiosks` | Sinh trắc học |
| 38 | POST | `/api/v1/branches/:branch_id/kiosks` | Sinh trắc học |
| 39 | PUT | `/api/v1/branches/:branch_id/kiosks/:kiosk_id` | Sinh trắc học |
| 40 | POST | `/api/v1/kiosks/:kiosk_id/heartbeat` | Sinh trắc học |
| 41 | POST | `/api/v1/kiosks/:kiosk_id/verify-face` | Sinh trắc học |
| 42 | GET | `/api/v1/branches/:branch_id/shift-templates` | Ca & Chấm công |
| 43 | POST | `/api/v1/branches/:branch_id/shift-templates` | Ca & Chấm công |
| 44 | PUT | `/api/v1/branches/:branch_id/shift-templates/:template_id` | Ca & Chấm công |
| 45 | DELETE | `/api/v1/branches/:branch_id/shift-templates/:template_id` | Ca & Chấm công |
| 46 | GET | `/api/v1/shifts` | Ca & Chấm công |
| 47 | POST | `/api/v1/shifts` | Ca & Chấm công |
| 48 | POST | `/api/v1/shifts/batch` | Ca & Chấm công |
| 49 | PATCH | `/api/v1/shifts/:shift_id/status` | Ca & Chấm công |
| 50 | POST | `/api/v1/attendance-events` | Ca & Chấm công |
| 51 | POST | `/api/v1/attendance-events/batch-sync` | Ca & Chấm công |
| 52 | GET | `/api/v1/attendance-events` | Ca & Chấm công |
| 53 | POST | `/api/v1/employees/:employee_id/fallback-codes` | Ca & Chấm công |
| 54 | POST | `/api/v1/attendance-events/verify-fallback` | Ca & Chấm công |
| 55 | GET | `/api/v1/attendance-summaries` | Ca & Chấm công |
| 56 | POST | `/api/v1/attendance-summaries/rebuild` | Ca & Chấm công |
| 57 | GET | `/api/v1/leave-requests` | Nghỉ phép |
| 58 | POST | `/api/v1/leave-requests` | Nghỉ phép |
| 59 | GET | `/api/v1/leave-requests/:leave_id` | Nghỉ phép |
| 60 | PUT | `/api/v1/leave-requests/:leave_id` | Nghỉ phép |
| 61 | PATCH | `/api/v1/leave-requests/:leave_id/approve` | Nghỉ phép |
| 62 | PATCH | `/api/v1/leave-requests/:leave_id/reject` | Nghỉ phép |
| 63 | GET | `/api/v1/employees/:employee_id/leave-balances` | Nghỉ phép |
| 64 | PUT | `/api/v1/employees/:employee_id/leave-balances` | Nghỉ phép |
| 65 | POST | `/api/v1/leave-balances/initialize` | Nghỉ phép |
| 66 | GET | `/api/v1/payroll-policies` | Lương |
| 67 | POST | `/api/v1/payroll-policies` | Lương |
| 68 | PUT | `/api/v1/payroll-policies/:policy_id` | Lương |
| 69 | GET | `/api/v1/payroll-records` | Lương |
| 70 | POST | `/api/v1/payroll-records/generate` | Lương |
| 71 | GET | `/api/v1/payroll-records/:payroll_id` | Lương |
| 72 | PATCH | `/api/v1/payroll-records/:payroll_id/status` | Lương |
| 73 | GET | `/api/v1/payroll-records/:payroll_id/disputes` | Lương |
| 74 | POST | `/api/v1/payroll-records/:payroll_id/disputes` | Lương |
| 75 | PATCH | `/api/v1/payroll-disputes/:dispute_id/resolve` | Lương |
| 76 | POST | `/api/v1/payroll-records/:payroll_id/adjustments` | Lương |
| 77 | GET | `/api/v1/payroll-records/:payroll_id/adjustments` | Lương |
| 78 | POST | `/api/v1/export-jobs` | Hệ thống |
| 79 | GET | `/api/v1/export-jobs` | Hệ thống |
| 80 | GET | `/api/v1/export-jobs/:job_id` | Hệ thống |
| 81 | GET | `/api/v1/notifications` | Hệ thống |
| 82 | PATCH | `/api/v1/notifications/:notification_id/read` | Hệ thống |
| 83 | PATCH | `/api/v1/notifications/read-all` | Hệ thống |
| 84 | GET | `/api/v1/notifications/unread-count` | Hệ thống |
| 85 | GET | `/api/v1/audit-logs` | Hệ thống |

> **Tổng cộng: 85 endpoints** phủ đầy 7 phân hệ, 69 yêu cầu chức năng (FR-ORG/EMP/BIO/SHF/LEA/PAY/SYS).

---

*Tài liệu Đặc tả API (API Specification) v1.0 — Được biên soạn dựa trên SRS, SAD, Flowcharts và Database Schema của dự án UTT.*
