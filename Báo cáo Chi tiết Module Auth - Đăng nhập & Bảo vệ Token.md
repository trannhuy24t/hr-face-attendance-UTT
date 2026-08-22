# BÁO CÁO CHI TIẾT: PHÂN HỆ ĐĂNG NHẬP, BẢO VỆ TOKEN & QUẢN LÝ PHIÊN

**(Module Auth — Login, JWT Guard, Refresh Token Rotation, Logout)**

**Hệ thống Quản lý Nhân sự, Chấm công Sinh trắc học & Tính lương Multi-Tenant**

---

## 1. Tổng quan

Phân hệ này bổ sung 3 API mới (`Login`, `Refresh`, `Logout`) và 1 cơ chế bảo vệ (`JwtAuthGuard`) vào hệ thống Auth Module. Mục tiêu là hoàn thiện vòng đời xác thực hoàn chỉnh:

```
Đăng ký → Đăng nhập → Gọi API (có bảo vệ) → Gia hạn Token → Đăng xuất
```

---

## 2. Kiến trúc bảo mật (Security Architecture)

### 2.1. Chiến lược "Vé ra vào kép" (Dual Token Strategy)

Hệ thống sử dụng 2 loại token với vòng đời khác nhau:

| Loại Token | Nơi | Tiêu chí | Giải pháp trong code | Tại sao làm vậy? |
| :--- | :--- | :--- | :--- | :--- |
| **Bảo vệ mật khẩu** | `argon2.verify()` | Argon2 là tiêu chuẩn băm mật khẩu mạnh nhất hiện nay, chống lại brute-force và rainbow table. |
| **XSS Attack** | Set Cookie `HttpOnly` | Javascript trên trình duyệt không thể đọc được cookie, hacker chèn script cũng không lấy được Refresh Token. |
| **CSRF Attack** | Cookie `SameSite=Strict` | Trình duyệt chỉ gửi Cookie nếu request xuất phát từ chính domain của web, chống giả mạo request. |
| **Session Fixation** | Mỗi lần đăng nhập sinh 1 `AuthSession` mới | Đăng nhập trên nhiều thiết bị (Multi-Device) không bị "đá văng" nhau. Hỗ trợ khóa riêng từng phiên. |
| **Brute-force** | `AuthCredentialThrottlerGuard` (IP + Email Hash) | Không chỉ block theo IP, hệ thống block theo tổ hợp IP và Email. Chống dò mật khẩu vào 1 tài khoản cụ thể mà không khóa oan người khác dùng chung WiFi. |

### 2.2. Tại sao phải tách làm 2 token?

**Vấn đề:** Nếu chỉ dùng 1 Access Token sống lâu (7 ngày), khi Hacker đánh cắp được token đó (qua XSS, lộ log...), họ sẽ có quyền truy cập hệ thống suốt 7 ngày.

**Giải pháp:** Chia nhỏ rủi ro:
- Access Token chỉ sống **15 phút** → Nếu bị lộ, Hacker chỉ có 15 phút để khai thác.
- Refresh Token lưu trong **HttpOnly Cookie** → JavaScript (XSS) KHÔNG THỂ đọc được cookie này, vì trình duyệt tự quản lý và chỉ gửi kèm khi gọi đúng path `/api/v1/auth/*`.

### 2.3. Cơ chế Token Rotation (Xoay vòng Token)

Mỗi lần Client dùng Refresh Token để xin Access Token mới:
1. Server giải mã và kiểm tra claim `typ === 'refresh'`.
2. Server thực hiện **Atomic Conditional Update** (`updateMany` với `where hash cũ`) để chống Race Condition.
3. Nếu thành công (count = 1), Server cấp Token mới hoàn toàn và lưu hash mới.
4. Nếu thất bại (count = 0), tức là ai đó đang dùng lại Refresh Token cũ (đã bị xóa) → Server phát hiện token bị đánh cắp → **Thu hồi toàn bộ phiên** (Force Logout).

```
Lần 1: Client gửi RT-A → Server xóa RT-A, cấp RT-B → OK
Lần 2: Client gửi RT-B → Server xóa RT-B, cấp RT-C → OK
Lần 3: Hacker gửi RT-A (đã cũ) → Server: "Token này đã bị xóa!" → REVOKE ALL
```

---

## 3. Luồng xử lý chi tiết từng API

### 3.1. API Đăng nhập (`POST /api/v1/auth/login`)

#### Request:
```json
{
  "email": "giamdoc@abc.com",
  "password": "Password123!"
}
```

#### Luồng xử lý bên trong Server:

**Bước 1: ValidationPipe & DTO**
- Kiểm tra email đúng định dạng `@`, password không rỗng.
- Chuẩn hóa email: `trim()` + `toLowerCase()`.
- Nếu sai → Trả `400 Bad Request`.

**Bước 2: Tìm User trong Database**
```sql
SELECT * FROM users WHERE email = 'giamdoc@abc.com' AND deleted_at IS NULL;
```
- Nếu không tìm thấy → Trả `401 Unauthorized`: *"Email hoặc mật khẩu không chính xác"*.
- **Lưu ý bảo mật:** Luôn dùng thông báo mơ hồ (Vague Error). KHÔNG BAO GIỜ nói rõ "Email không tồn tại" hay "Mật khẩu sai" — vì Hacker sẽ biết email nào đã đăng ký để tấn công tiếp.

**Bước 3: Xác minh mật khẩu bằng Argon2**
```typescript
const valid = await argon2.verify(user.passwordHash, dto.password);
```
- Argon2 lấy chuỗi hash trong DB (`$argon2id$v=19$...`), chạy lại thuật toán với mật khẩu vừa nhập.
- Quá trình này **cố ý tốn ~100ms** (chống tấn công Brute Force — thử hàng triệu mật khẩu).
- Nếu sai → Trả `401 Unauthorized`.

**Bước 4: Tạo Phiên (Session) & Sinh Tokens**
Khác với MVP chỉ lưu 1 token trên bảng User, hệ thống Enterprise tạo một bản ghi mới trong bảng `auth_sessions`:

```typescript
const session = await this.prisma.authSession.create({ ... });

// Refresh token chứa jti = session.id
const refreshToken = this.signRefreshToken(..., session.id); 
```

Server trả về JSON chứa `access_token` và gửi `refresh_token` ngầm qua `Set-Cookie`.

#### Response `200 OK`:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "giamdoc@abc.com",
      "fullName": "Nguyễn Văn A",
      "roles": [{ "branch_id": null, "role": "owner" }]
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```
*(Refresh Token không hiện trong JSON mà được gửi ngầm qua Cookie)*

---

### 3.2. Vòng đời Request & Cơ chế Bảo vệ Đầu cuối (Secure By Default)

Hệ thống được thiết kế theo kiến trúc **"Secure By Default"** (An Toàn Mặc Định). Tất cả các API sinh ra đều tự động bị khóa kín bởi các Guard (chốt chặn) được đăng ký toàn cục tại `app.module.ts`. Bất kỳ lập trình viên nào muốn mở API ra cho bên ngoài đều phải chủ động khai báo bằng Decorator `@Public()`.

Khi một Request (Ví dụ: `GET /api/v1/employees`) chạm vào Server, nó bắt buộc phải xuyên qua **5 lớp màng lọc** theo trình tự sau:

#### Lớp 1: Middleware Cơ bản (`src/main.ts`)
- **`helmet()`**: Gắn các header bảo mật HTTP chống XSS, Clickjacking.
- **`cookieParser()`**: Phân tích cú pháp của Header Cookie, trích xuất chuỗi thành dạng Object (`req.cookies`) để Server dễ dàng truy xuất `refresh_token` trong các phiên đăng nhập hoặc cấp lại token.

#### Lớp 2: Chặn Spam - Throttler Guard (`src/app.module.ts`)
- NestJS luôn kích hoạt Guard đầu tiên. Lớp màng này là **`ThrottlerGuard`**.
- Mặc định: Giới hạn 100 requests / phút đối với toàn bộ API để chặn DDoS bề mặt.
- Mở rộng: Riêng API `/auth/login` được gắn một Guard tùy chỉnh **`AuthCredentialThrottlerGuard`** (Giới hạn 5 lần / phút). Guard này kết hợp `IP Address + Mã băm SHA-256 của Email`. Điều này giúp hệ thống block đứng hành vi dò mật khẩu trên 1 tài khoản cụ thể, nhưng KHÔNG khóa oan những nhân viên khác đang dùng chung mạng WiFi công ty.

#### Lớp 3: Kiểm vé - JwtAuthGuard (`src/modules/auth/guards/jwt-auth.guard.ts`)
- Nếu Request qua được vòng kiểm soát bạo lực, nó gặp **`JwtAuthGuard`**.
- Guard này nhìn vào Controller đang được gọi. Nếu thấy có gắn `@Public()` (như ở API login/register), nó sẽ cho qua cửa luôn.
- Nếu KHÔNG có `@Public()`, nó đòi Access Token trong Header `Authorization: Bearer <token>`.
- Guard gọi đến **`JwtStrategy`** để giải mã Token bằng `JWT_ACCESS_SECRET`. Nếu hết hạn hoặc sai chữ ký → `401 Unauthorized`.
- Nếu Token hợp lệ, `JwtStrategy` kiểm tra DB xem user có tồn tại và chưa bị khóa hay không. Nếu hợp lệ, nó trả về thông tin `{ userId, tenantId, roles }` và gắn vào biến **`req.user`**.

#### Lớp 4: Soi Quyền - RolesGuard (`src/core/guards/roles.guard.ts`)
- Lúc này Request đã mang thân phận rõ ràng (có `req.user`). Nó bước qua chốt chặn **`RolesGuard`**.
- Guard này đọc các Decorator `@Roles()` và `@BranchParam()` gắn trên Controller/API.
- Lục tìm trong danh sách `req.user.roles`:
  - Nếu user là `Owner` (`branchId = null`), lập tức cho qua mọi cửa (Quyền tối cao toàn chi nhánh).
  - Nếu là Quản lý chi nhánh (`Manager`), nó sẽ lấy tham số `branchId` trên URL (ví dụ `/branches/:branchId/employees`) để so sánh xem nhánh đang truy cập có khớp với quyền quản lý của user hay không.
- Nếu không khớp quyền → `403 Forbidden`.

#### Lớp 5: Bơm Context Xuyên thấu - TenantInterceptor (`src/core/interceptors/tenant.interceptor.ts`)
- Vượt qua 4 lớp trên, Request đã chứng minh được nó hoàn toàn an toàn và có thẩm quyền. Cuối cùng, nó gặp **`TenantInterceptor`**.
- Lớp này sẽ "chộp" lấy giá trị `tenantId` từ `req.user` và ném vào một bong bóng lưu trữ vô hình mang tên **`AsyncLocalStorage`** (Node.js).
- Nhờ vậy, Request đi sâu vào Controller và Controller gọi xuống các Service (Ví dụ `EmployeeService`, `PayrollService`) mà **KHÔNG CẦN** phải mang vác tham số `tenantId` truyền tay qua từng hàm. 
- Bất kỳ lúc nào Service thao tác với DB, nó chỉ việc gọi `TenantContext.getTenantId()` là có ngay ngữ cảnh của Doanh nghiệp hiện tại, đảm bảo không bao giờ bị "rò rỉ" hay truy xuất nhầm dữ liệu của công ty khác (Tenant Isolation).

```mermaid
flowchart TD
    Req([Incoming Request]) --> L1

    subgraph L1 [Lớp 1: Middleware]
        H[Helmet - Security Headers] --> C[Cookie Parser]
    end

    C --> L2
    
    subgraph L2 [Lớp 2: Throttler Guard]
        T{Quá giới hạn Rate Limit?}
    end

    T -- Có (Spam) --> E429[HTTP 429 Too Many Requests]
    T -- Không --> L3
    
    subgraph L3 [Lớp 3: JwtAuthGuard]
        P{Có @Public()?}
        P -- Có --> L4
        P -- Không --> J{Ký hợp lệ & Còn hạn?}
        J -- Không --> E401[HTTP 401 Unauthorized]
        J -- Có --> DB[Check DB & Gắn req.user]
        DB --> L4
    end

    subgraph L4 [Lớp 4: RolesGuard]
        R{Khớp Quyền & Chi nhánh?}
    end
    
    L4 -- Không --> E403[HTTP 403 Forbidden]
    L4 -- Có --> L5
    
    subgraph L5 [Lớp 5: TenantInterceptor]
        Ctx[Tạo AsyncLocalStorage Context]
        Ctx --> TId[Lưu tenantId vào Context]
    end

    L5 --> Ctrl([Controller & Services])
    Ctrl --> Res([Response])
    
    classDef error fill:#ffcccc,stroke:#ff0000,stroke-width:2px;
    class E429,E401,E403 error;
    classDef success fill:#d4edda,stroke:#28a745,stroke-width:2px;
    class Ctrl,Res success;
```

---

### 3.3. API Cấp lại Token (`POST /api/v1/auth/refresh`)

#### Tình huống:
Sau 15 phút, Access Token hết hạn. Frontend gọi API → Server trả `401`. Frontend tự động gọi `/auth/refresh` ở ngầm.

#### Luồng xử lý:

**Bước 1:** Trình duyệt tự động gửi HttpOnly Cookie chứa Refresh Token lên Server.

**Bước 2:** Server giải mã Refresh Token bằng `JWT_REFRESH_SECRET` và kiểm tra `payload.typ === 'refresh'`.
- Nếu token giả, hết hạn, hoặc là Access Token → 401.

**Bước 3:** **Giải pháp Enterprise:** Conditional Update trên bảng `auth_sessions`:

```typescript
// Chỉ update nếu id (session_id) và hash hiện tại khớp
const updateResult = await this.prisma.authSession.updateMany({
  where: { id: sessionId, refreshTokenHash: oldHash, revokedAt: null },
  data: { refreshTokenHash: newHash, lastUsedAt: new Date() },
});

if (updateResult.count === 0) {
  // Hash không khớp -> Token cũ bị reuse -> Tìm familyId và thu hồi TOÀN BỘ phiên thuộc gia đình token này
  const session = await this.prisma.authSession.findUnique({ where: { id: sessionId } });
  if (session) {
    await this.prisma.authSession.updateMany({
      where: { familyId: session.familyId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: 'token_reuse' },
    });
  }
  throw new UnauthorizedException('Token reuse detected');
}
```

> **Cơ chế Token Family (Dòng họ Token):** Mỗi lần đăng nhập sinh ra một `familyId`. Khi refresh, Token mới sinh ra vẫn giữ nguyên `familyId`. Nhờ vậy, nếu hacker đánh cắp và dùng lại Token cũ, hệ thống phát hiện `count === 0` và lập tức dùng `familyId` khóa sạch mọi Token (cả của hacker lẫn của người dùng thật). Người dùng bắt buộc phải đăng nhập lại.

> **UX Tối ưu: Mutex Queue ở Frontend**
> Với chính sách Strict Rotation trên Backend, nếu người dùng mở 2 Tab và cả 2 cùng xin token mới lúc hết hạn, Tab 2 sẽ bị nghi là Hacker (vì gửi token cũ vừa bị Tab 1 xoay vòng) -> Bị Logout oan uổng. 
> 
> **Quyết định kiến trúc:** Backend giữ nguyên lớp phòng thủ nghiêm ngặt (UpdateMany). Lỗi UX này phải được xử lý ở **Frontend**. Frontend sử dụng Axios Interceptor + **Mutex Queue**: Khi Tab 1 đang refresh, Tab 2 bị lock lại đưa vào hàng đợi. Tab 1 lấy xong token mới -> nhả lock -> Tab 2 dùng token mới để chạy tiếp. Kiến trúc này giữ cho Backend đơn giản, an toàn tuyệt đối và Frontend mượt mà.

**Bước 5:** Set Cookie mới chứa Refresh Token mới.

#### Response `200 OK`:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs... (MỚI)"
  }
}
```

---

### 3.4. API Đăng xuất (`POST /api/v1/auth/logout`)

**Yêu cầu:** Phải đăng nhập (có Access Token hợp lệ). Endpoint được bảo vệ bởi `@UseGuards(JwtAuthGuard)`.

#### Luồng xử lý:

**Bước 1:** JwtAuthGuard xác minh Access Token → Trích `userId` từ `req.user`.

**Bước 2:** Controller đọc Refresh Cookie để lấy mã `sid` (Session ID).

**Bước 3:** Soft-delete phiên đăng nhập (Đánh dấu `revokedAt`):
```sql
UPDATE auth_sessions 
SET revoked_at = NOW(), revoked_reason = 'logout' 
WHERE id = '<sid>' AND user_id = '<userId>';
```
*(Nếu client không có cookie, hệ thống fallback sang thu hồi TOÀN BỘ các session của user).*

**Bước 4:** Xóa Cookie `refresh_token` trên trình duyệt:
```typescript
res.clearCookie('refresh_token', { ... });
```

**Kết quả:**
- Chỉ thiết bị hiện tại (Web) bị đăng xuất. Trình duyệt khác hoặc Mobile app vẫn tiếp tục hoạt động (Multi-device logout độc lập).
- Refresh Token cũ bị vô hiệu hóa. Access Token hiện tại vẫn hoạt động trên bộ nhớ máy khách cho đến khi hết hạn (tối đa 15 phút).

---

## 4. Xử lý lỗi (Error Handling)

| API | Tình huống | HTTP Code | Error Code | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| Login | Email/Mật khẩu sai | 401 | `INVALID_CREDENTIALS` | Thông báo mơ hồ (không tiết lộ email tồn tại) |
| Login | Tài khoản đã bị xóa | 401 | `INVALID_CREDENTIALS` | Xử lý giống sai mật khẩu |
| Refresh | Token giả/hết hạn | 401 | `INVALID_REFRESH_TOKEN` | Yêu cầu đăng nhập lại |
| Refresh | Token cũ bị tái sử dụng | 401 | `TOKEN_REUSE_DETECTED` | Thu hồi toàn bộ phiên (Bảo mật) |
| Logout | Chưa đăng nhập | 401 | `Unauthorized` | JwtAuthGuard chặn |
| Tất cả | Dữ liệu đầu vào sai | 400 | `VALIDATION_ERROR` | DTO chặn trước khi vào Service |

---

## 5. Sơ đồ tổng thể vòng đời xác thực

```
┌─────────┐     POST /register      ┌─────────┐     Lưu hash RT
│  Client ├────────────────────────→│  Server ├──────────────────→ DB
│         │←── 201 + AT + Cookie ───┤         │
└────┬────┘                          └─────────┘
     │
     │ Gọi API với AT
     ├──────────────────────────────→ JwtAuthGuard → OK → Data
     │
     │ (15 phút sau, AT hết hạn)
     │ Gọi API → 401
     │
     │ POST /refresh (Cookie tự gửi RT)
     ├──────────────────────────────→ So hash RT → Sinh AT mới + RT mới
     │←── 200 + AT mới + Cookie mới──┤
     │
     │ Gọi API với AT mới → OK
     │
     │ POST /logout (có AT)
     ├──────────────────────────────→ Xóa hash RT + Xóa Cookie
     │←── 200 Đăng xuất thành công ──┤
     │
     │ Gọi API → 401 (AT hết hạn, không thể refresh)
```

---

## 6. Danh sách file mã nguồn

| File | Đường dẫn | Chức năng |
| :--- | :--- | :--- |
| `login.dto.ts` | `src/modules/auth/dto/` | Kiểm tra dữ liệu đăng nhập (email + password) |
| `auth.service.ts` | `src/modules/auth/services/` | Xử lý nghiệp vụ: Login, Refresh (Token Rotation), Logout |
| `auth.controller.ts` | `src/modules/auth/controllers/` | 4 endpoints: register, login, refresh, logout |
| `jwt.strategy.ts` | `src/modules/auth/strategies/` | Giải mã JWT, kiểm tra user tồn tại, gắn req.user |
| `jwt-auth.guard.ts` | `src/modules/auth/guards/` | Decorator `@UseGuards(JwtAuthGuard)` bảo vệ endpoint |
| `auth.module.ts` | `src/modules/auth/` | Đăng ký tất cả providers vào NestJS |
| `main.ts` | `src/` | Thêm `cookie-parser` middleware để đọc Cookie |

---

## 7. Công nghệ bổ sung

| Công nghệ | Vai trò |
| :--- | :--- |
| **cookie-parser** | Middleware đọc Cookie từ request (lấy Refresh Token) |
| **crypto (Node.js built-in)** | Băm SHA-256 Refresh Token trước khi lưu DB |
| **Passport.js + @nestjs/passport** | Framework xác thực chuẩn công nghiệp cho NestJS |
| **passport-jwt** | Strategy trích xuất và xác minh JWT từ Header |

---

## 8. Kết quả kiểm thử

- **Build TypeScript:** ✅ Thành công, không có lỗi biên dịch.
- **Database:** Đã thêm cột `refresh_token_hash` vào bảng `users`.
- **Fail-Fast:** Server từ chối khởi động nếu 1 trong 2 secret bị thiếu, trùng nhau hoặc dùng giá trị default.
- **Bảo mật cao:** Fix triệt để Race Condition, phân loại claim `typ`, và không làm lộ Refresh Token trong JSON response.
