# BÁO CÁO CHI TIẾT: PHÂN HỆ ĐĂNG KÝ DOANH NGHIỆP

**(Module Auth — API Register Tenant)**

**Hệ thống Quản lý Nhân sự, Chấm công Sinh trắc học & Tính lương Multi-Tenant**

---

## 1. Tổng quan

API Đăng ký Doanh nghiệp (`POST /api/v1/auth/register`) là API đầu tiên và quan trọng nhất của toàn bộ hệ thống. Đây là API "khởi thủy" — nếu không có nó thì không tồn tại bất kỳ dữ liệu nào trong hệ thống.

**Chức năng:** Cho phép một người dùng mới đăng ký tạo doanh nghiệp (Tenant) trên hệ thống. Sau khi đăng ký thành công, hệ thống tự động khởi tạo toàn bộ cơ sở hạ tầng dữ liệu cần thiết cho doanh nghiệp đó và cấp quyền quản trị cao nhất (Owner) cho người đăng ký.

---

## 2. Kiến trúc Module (3 tầng)

Hệ thống được thiết kế theo kiến trúc **3 tầng (3-Layer Architecture)** của NestJS, mỗi tầng có một trách nhiệm duy nhất:

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT (Trình duyệt Web)                    │
│              Gửi JSON lên POST /api/v1/auth/register            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  TẦNG 1: DTO (Data Transfer Object)                             │
│  File: register.dto.ts                                          │
│                                                                 │
│  Vai trò: "Bảo vệ cổng" — Kiểm tra dữ liệu đầu vào.          │
│  • Email có đúng định dạng @?                                   │
│  • Mật khẩu có đủ mạnh (≥8 ký tự, chữ hoa, chữ thường, số)?   │
│  • Tên công ty có bị bỏ trống không?                            │
│  → Nếu SAI: Trả lỗi 400 Bad Request ngay. KHÔNG đi tiếp.      │
│  → Nếu ĐÚNG: Cho phép đi vào Tầng 2.                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  TẦNG 2: Controller                                             │
│  File: auth.controller.ts                                       │
│                                                                 │
│  Vai trò: "Lễ tân" — Nhận request đã sạch, chuyển tiếp.        │
│  • Định nghĩa đường dẫn URL: POST /auth/register               │
│  • Nhận DTO (dữ liệu đã kiểm tra)                              │
│  • Gọi AuthService.register(dto)                                │
│  • Trả kết quả JSON về cho Client                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  TẦNG 3: Service                                                │
│  File: auth.service.ts                                          │
│                                                                 │
│  Vai trò: "Bộ não" — Xử lý toàn bộ nghiệp vụ phức tạp.        │
│  • Kiểm tra email trùng lặp trong Database                      │
│  • Băm mật khẩu bằng thuật toán Argon2                          │
│  • Mở Prisma Transaction → INSERT 5 bảng                        │
│  • Sinh JWT Access Token + Refresh Token                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Luồng xử lý chi tiết (Step-by-step)

### Bước 1: Client gửi Request

Người dùng (ví dụ: Giám đốc công ty ABC) điền Form đăng ký trên giao diện Web và ấn nút "Đăng ký". Trình duyệt sẽ gửi một HTTP Request dạng JSON lên Server:

```http
POST /api/v1/auth/register HTTP/1.1
Content-Type: application/json

{
  "companyName": "Công ty TNHH ABC",
  "email": "giamdoc@abc.com",
  "password": "Password123!",
  "fullName": "Nguyễn Văn A",
  "phone": "0912345678"
}
```

### Bước 2: ValidationPipe & DTO (Kiểm tra đầu vào)

Khi gói JSON bay đến Server NestJS, nó chưa kịp chạm vào Controller thì đã bị chặn lại bởi cơ chế **ValidationPipe** (Đường ống kiểm tra toàn cục).

ValidationPipe sẽ ánh xạ (map) gói JSON vào class `RegisterDto` và chạy lần lượt từng luật kiểm tra:

| Trường | Luật kiểm tra | Ví dụ lỗi |
| :--- | :--- | :--- |
| `companyName` | Không được rỗng, tối đa 255 ký tự | `"Tên công ty không được để trống"` |
| `email` | Phải đúng định dạng email (`@`) | `"Email không đúng định dạng"` |
| `password` | ≥ 8 ký tự, chứa chữ hoa + chữ thường + số | `"Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số"` |
| `fullName` | Không được rỗng, tối đa 255 ký tự | `"Họ tên không được để trống"` |
| `phone` | Không bắt buộc (optional) | — |

**Nếu vi phạm bất kỳ luật nào:** Server trả về lỗi `400 Validation Error` ngay lập tức. Request KHÔNG BAO GIỜ chạm được đến Database. Điều này cực kỳ quan trọng vì:
- Tiết kiệm tài nguyên Server (không phải mở kết nối DB vô ích).
- Bảo vệ Database khỏi dữ liệu rác.
- Validation diễn ra trước khi truy cập DB, giúp phản hồi nhanh cho người dùng.

### Bước 3: AuthController (Lễ tân tiếp nhận)

Nếu dữ liệu hợp lệ, Controller nhận DTO đã sạch và gọi Service. Ngoài ra, Controller còn chịu trách nhiệm:
- Nhận `_refreshToken` từ Service (trường nội bộ, không trả cho Client).
- Gửi Refresh Token vào **HttpOnly Cookie** (JavaScript/XSS không đọc được).
- Loại bỏ `_refreshToken` khỏi JSON response bằng destructuring.

```typescript
@Post('register')
async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
  const result = await this.authService.register(dto);

  // Gửi Refresh Token qua HttpOnly Cookie (Bảo mật XSS)
  this.setRefreshCookie(res, result._refreshToken);

  // Trả JSON không chứa refresh_token
  const { _refreshToken, ...response } = result;
  return response;
}
```

Controller không tự xử lý logic. Trong NestJS, Controller chỉ đóng vai trò "Lễ tân" — nhận request, chuyển cho bộ phận nghiệp vụ (Service), và trả kết quả.

### Bước 4: AuthService — Kiểm tra Email trùng lặp

Service nhận DTO và bắt đầu xử lý nghiệp vụ. Việc đầu tiên là kiểm tra xem email đã có ai dùng chưa:

```typescript
const existingUser = await this.prisma.user.findUnique({
  where: { email: dto.email },
});
```

Prisma ORM dịch dòng code TypeScript trên thành câu SQL:
```sql
SELECT * FROM users WHERE email = 'giamdoc@abc.com' LIMIT 1;
```

**Nếu tìm thấy:** Ném lỗi `409 Conflict` với mã `EMAIL_ALREADY_EXISTS`. Hệ thống dừng lại tại đây, không tạo dữ liệu.

### Bước 5: AuthService — Băm mật khẩu bằng Argon2

```typescript
const passwordHash = await argon2.hash(dto.password);
```

Thuật toán **Argon2** (đoạt giải nhất cuộc thi Password Hashing Competition 2015) sẽ chuyển đổi mật khẩu gốc thành một chuỗi mã hóa **không thể đảo ngược**:

```
Input:  "Password123!"
Output: "$argon2id$v=19$m=65536,t=3,p=4$bXlzYWx0$..."  (≈ 97 ký tự)
```

**Tại sao phải băm?**
- Nếu Database bị hacker xâm nhập, họ chỉ thấy chuỗi loằng ngoằng, không lấy được mật khẩu thật.
- Ngay cả quản trị viên hệ thống (Admin) cũng không thể biết mật khẩu thật của người dùng.
- Đây là yêu cầu bắt buộc theo tiêu chuẩn bảo mật OWASP.

### Bước 6: AuthService — Prisma Transaction (All or Nothing)

Đây là phần phức tạp nhất và cũng là phần "ăn điểm" nhất trong báo cáo. Hệ thống cần tạo dữ liệu trong **6 bảng liên kết** chỉ bằng 1 request duy nhất:

```typescript
const result = await this.prisma.$transaction(async (tx) => {
  // Lệnh 1 → Lệnh 2 → Lệnh 3 → Lệnh 4 → Lệnh 5 → Lệnh 6
});
```

**Nguyên tắc Transaction:**
- Nếu cả 6 lệnh đều thành công → **COMMIT** (lưu vĩnh viễn vào Database).
- Nếu BẤT KỲ lệnh nào thất bại (ví dụ: lệnh 6 bị lỗi mạng) → **ROLLBACK** (hủy bỏ toàn bộ, kể cả 5 lệnh trước đó đã chạy thành công).

Chi tiết 6 lệnh INSERT trong Transaction:

#### Lệnh 1: Tạo Tenant (Doanh nghiệp)

```sql
INSERT INTO tenants (id, name, created_at)
VALUES (gen_random_uuid(), 'Công ty TNHH ABC', NOW());
```

→ Kết quả: Sinh ra 1 `tenant_id` (UUID) duy nhất trên toàn hệ thống.

#### Lệnh 2: Tạo Cấu hình mặc định (Tenant Settings)

```sql
INSERT INTO tenant_settings (id, tenant_id, face_match_threshold, max_face_retries)
VALUES (gen_random_uuid(), '<tenant_id>', 0.85, 3);
```

→ Cấu hình mặc định: Ngưỡng nhận diện khuôn mặt là 85%, cho phép quét lại tối đa 3 lần.

#### Lệnh 3: Tạo Chi nhánh mặc định (Trụ sở chính)

```sql
INSERT INTO branches (id, tenant_id, name, timezone, currency, created_at)
VALUES (gen_random_uuid(), '<tenant_id>', 'Trụ sở chính', 'Asia/Ho_Chi_Minh', 'VND', NOW());
```

→ Mỗi doanh nghiệp đều có một Trụ sở chính khi vừa đăng ký.

#### Lệnh 4: Tạo User (Tài khoản Owner)

```sql
INSERT INTO users (id, tenant_id, email, full_name, phone, password_hash, created_at)
VALUES (gen_random_uuid(), '<tenant_id>', 'giamdoc@abc.com', 'Nguyễn Văn A', '0912345678', '$argon2id$v=19$...', NOW());
```

→ Lưu họ tên, SĐT, email và mật khẩu đã băm. Trường `employee_id` là NULL vì Owner chưa phải là nhân viên.

#### Lệnh 5: Gán quyền Owner

```sql
INSERT INTO user_branch_roles (id, user_id, branch_id, role, created_at)
VALUES (gen_random_uuid(), '<user_id>', NULL, 'owner', NOW());
```

→ `branch_id = NULL` vì Owner có quyền trên toàn bộ hệ thống, không bị giới hạn bởi chi nhánh nào.

#### Lệnh 6: Tạo Phiên (Auth Session)

```sql
INSERT INTO auth_sessions (id, user_id, family_id, refresh_token_hash, device_info, ip_address, expires_at)
VALUES (gen_random_uuid(), '<user_id>', '<family_id>', '$2b$10$...', 'Mozilla/5.0...', '192.168.1.1', '2026-08-23...');
```

→ Lưu phiên đăng nhập hỗ trợ Multi-Device. Bước này đảm bảo tính "Atomic 100%" - tạo Doanh nghiệp xong, sinh Token, lưu Session cùng lúc. Lỗi bất kỳ dòng nào (kể cả quá trình Hash token hay lỗi mạng DB) đều Rollback sạch sẽ.

### Bước 7: Sinh JWT Token (Vé vào cổng)

Sau khi Transaction thành công, hệ thống tạo ra 2 mã JWT:

| Loại Token | Thời hạn | Mục đích |
| :--- | :--- | :--- |
| **Access Token** | 15 phút | "Vé VIP" — Gắn vào mọi request API sau này để chứng minh danh tính |
| **Refresh Token** | 7 ngày | "Vé gia hạn" — Khi Access Token hết hạn, dùng token này để xin cấp mới mà không cần đăng nhập lại |

Cấu trúc bên trong JWT (Payload):
```json
{
  "sub": "user_id (uuid)",
  "tenant_id": "uuid — Mã doanh nghiệp",
  "employee_id": null,
  "roles": [{ "branch_id": null, "role": "owner" }],
  "typ": "access",
  "sid": "auth_session_id (chỉ có trong refresh token)",
  "jti": "jwt_id (chỉ có trong refresh token)",
  "iat": 1720000000,
  "exp": 1720000900
}
```

**Lưu ý về claim `typ`:** Hệ thống phân biệt 2 loại token bằng trường `typ`:
- Access Token có `typ: 'access'` — dùng để gọi API.
- Refresh Token có `typ: 'refresh'` — dùng để xin Access Token mới.

Nếu ai đó cố dùng Refresh Token để gọi API bình thường, JwtStrategy sẽ kiểm tra `typ !== 'access'` và từ chối ngay.

### Bước 8: Trả kết quả về Client

Controller đóng gói toàn bộ kết quả vào JSON và gửi về với mã `201 Created`:

```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Công ty TNHH ABC"
    },
    "user": {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "email": "giamdoc@abc.com",
      "role": "owner"
    },
    "branch": {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "name": "Trụ sở chính",
      "timezone": "Asia/Ho_Chi_Minh",
      "currency": "VND"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```
*(Lưu ý: Refresh Token được gửi ngầm qua HttpOnly Cookie để bảo mật, không xuất hiện trong JSON)*

---

## 4. Xử lý lỗi (Error Handling)

| Tình huống | HTTP Code | Error Code | Mô tả |
| :--- | :--- | :--- | :--- |
| Dữ liệu đầu vào không hợp lệ | 400 | `VALIDATION_ERROR` | DTO bắt lỗi trước khi chạm DB |
| Email đã có người dùng | 409 | `EMAIL_ALREADY_EXISTS` | Bắt lỗi Race Condition (Prisma P2002 Unique Constraint) trong Transaction |
| Lỗi hệ thống (DB sập, mạng lỗi) | 500 | `REGISTRATION_FAILED` | Transaction 6 bản ghi khởi tạo sẽ ROLLBACK |

> **Lưu ý về phạm vi Atomic:** Transaction đảm bảo tính nguyên tử cho **tất cả 6 bản ghi khởi tạo** (Tenant → Settings → Branch → User → Role → Session). Không thể xảy ra tình trạng "Tạo user thành công nhưng không đăng nhập được".

---

## 5. Sơ đồ luồng (Flowchart)

```
[Client gửi JSON]
       │
       ▼
┌──────────────┐    SAI     ┌──────────────────┐
│ ValidationPipe├──────────→│ 400 Validation    │
│ & DTO         │            │ Error             │
└──────┬───────┘            └──────────────────┘
       │ ĐÚNG
       ▼
┌──────────────┐
│ Controller   │
│ (Lễ tân)     │
└──────┬───────┘
       │
       ▼
┌──────────────┐    CÓ      ┌──────────────────┐
│ Kiểm tra     ├──────────→│ 409 Email đã     │
│ email trùng  │            │ tồn tại          │
└──────┬───────┘            └──────────────────┘
       │ KHÔNG TRÙNG
       ▼
┌──────────────┐
│ Băm mật khẩu│
│ (Argon2)     │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────┐
│         PRISMA TRANSACTION               │
│                                          │
│  1. INSERT tenants                       │
│  2. INSERT tenant_settings               │
│  3. INSERT branches                      │
│  4. INSERT users                         │
│  5. INSERT user_branch_roles             │
│                                          │
│  ✅ Thành công → COMMIT                  │
│  ❌ Bất kỳ lỗi → ROLLBACK toàn bộ       │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────┐
│ Sinh JWT     │
│ Access Token │
│ + Refresh    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 201 Created  │
│ Trả kết quả  │
└──────────────┘
```

---

## 6. Công nghệ sử dụng

| Công nghệ | Phiên bản | Vai trò |
| :--- | :--- | :--- |
| **NestJS** | v11 | Framework Backend chính |
| **Prisma ORM** | v7.9 | Giao tiếp với Database, quản lý Migration |
| **Argon2** | Latest | Băm mật khẩu (OWASP approved) |
| **JWT (@nestjs/jwt)** | Latest | Sinh và xác thực Access Token / Refresh Token |
| **class-validator** | Latest | Kiểm tra dữ liệu đầu vào (DTO Validation) |
| **PostgreSQL** | v16 | Cơ sở dữ liệu quan hệ |
| **Swagger** | @nestjs/swagger | Tự động sinh tài liệu API trên giao diện Web |

---

## 7. Danh sách file mã nguồn

| File | Đường dẫn | Chức năng |
| :--- | :--- | :--- |
| `register.dto.ts` | `src/modules/auth/dto/` | Định nghĩa luật kiểm tra dữ liệu đầu vào |
| `auth.service.ts` | `src/modules/auth/services/` | Xử lý nghiệp vụ: kiểm tra email, băm mật khẩu, Transaction 5 bảng, sinh JWT |
| `auth.controller.ts` | `src/modules/auth/controllers/` | Định nghĩa endpoint `POST /auth/register`, nhận DTO và trả JSON |
| `auth.module.ts` | `src/modules/auth/` | Đăng ký Controller, Service, JwtModule vào hệ thống NestJS |

---

## 8. Kết quả kiểm thử

- **Build TypeScript:** ✅ Thành công, không có lỗi biên dịch.
- **Swagger UI:** Endpoint `POST /api/v1/auth/register` đã hiển thị trên trang `http://localhost:3000/docs`.
- **Database:** Transaction tạo thành công dữ liệu liên kết trong 5 bảng (`tenants`, `tenant_settings`, `branches`, `users`, `user_branch_roles`).
