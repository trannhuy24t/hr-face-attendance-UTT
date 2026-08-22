# TÀI LIỆU SƠ ĐỒ LUỒNG NGHIỆP VỤ (FLOWCHARTS)

---

## **1. Giới thiệu**
Tài liệu này tổng hợp toàn bộ các **Sơ đồ Luồng Nghiệp vụ (Flowcharts)** vẽ bằng định dạng **Mermaid** cho 7 phân hệ cốt lõi của hệ thống Quản lý Nhân sự, Chấm công Sinh trắc học & Tính lương Multi-Tenant. 

Tài liệu giúp lập trình viên Frontend, Backend, App Di Động, Kiosk và Kiểm thử viên (QA) dễ dàng hình dung và hiện thực hóa logic ứng dụng.

---

## **2. Danh sách 7 Sơ đồ Luồng Nghiệp vụ Chính**

### **2.1. Flowchart 1: Luồng Đăng ký Doanh nghiệp mới & Thiết lập Ban đầu (Tenant Onboarding)**

```mermaid
flowchart TD
    A[Chủ doanh nghiệp Owner vào Landing Page] --> B[Nhập thông tin: Tên Cty, Họ tên, Email, Mật khẩu, SĐT]
    B --> C[System Admin / Server kiểm tra tính hợp lệ]
    
    subgraph Transaction["Giao dịch Tự động trên Backend Database (Atomic Transaction)"]
        C --> D1[Tạo bản ghi trong bảng tenants]
        D1 --> D2[Tạo bản ghi tenant_settings mặc định: threshold=0.85, max_retries=3]
        D2 --> D3[Tạo bản ghi branches mặc định: Trụ sở chính, timezone=Asia/Ho_Chi_Minh]
        D3 --> D4[Tạo bản ghi users cho Owner]
        D4 --> D5[Tạo bản ghi user_branch_roles: role=owner, branch_id=null]
    end

    Transaction --> E[Trả về Token Đăng nhập & Mở màn hình Hướng dẫn Onboarding Wizard]
    
    subgraph Wizard["Các Bước Thiết Lập Ban Đầu (Onboarding Wizard)"]
        E --> F1[Bước 1: Tạo Chi nhánh phụ & Phòng ban departments]
        F1 --> F2[Bước 2: Thiết lập Ca làm việc mẫu shift_templates]
        F2 --> F3[Bước 3: Nhập danh sách Nhân viên employees & Lương compensation]
        F3 --> F4[Bước 4: Mời Kế toán Accountant & Quản lý Manager vào hệ thống]
        F4 --> F5[Bước 5: Thêm Kiosk kiosks & Thu thập mẫu khuôn mặt face_samples]
    end

    Wizard --> G[Hoàn tất: Đưa Hệ thống vào Vận hành]
```

---

### **2.2. Flowchart 2: Luồng Thu thập Cam kết Đồng ý & Đăng ký Mẫu Khuôn mặt AI**

```mermaid
flowchart TD
    A[Bắt đầu: Nhân viên mới Onboarding] --> B[Nhân viên đọc Điều khoản Bảo vệ Dữ liệu Sinh trắc học]
    B --> C{Nhân viên có bấm Đồng ý?}
    C -- Không đồng ý --> D[Ghi nhận từ chối / Chuyển sang chấm công bằng mã dự phòng PIN/QR]
    C -- Đồng ý --> E[Hệ thống lưu bản ghi biometric_consents với consented_at]
    E --> F[Quản lý / Kiosk mở màn hình Đăng ký Khuôn mặt]
    F --> G[Camera chụp 3 góc mặt: Chính diện, Nghiêng trái, Nghiêng phải]
    G --> H[AI Engine trích xuất Vector Descriptor & Gán model_version]
    H --> I[Lưu vào CSDL bảng face_embedding_samples]
    I --> J[Đồng bộ Vector mẫu xuống CSDL SQLite Local của Kiosk tại Chi nhánh]
    J --> K[Kết thúc: Đăng ký mẫu khuôn mặt thành công]
```

---

### **2.3. Flowchart 3: Luồng Chấm công Thời gian thực tại Kiosk (Check-in Realtime & Offline)**

```mermaid
flowchart TD
    A[Nhân viên đứng trước máy Kiosk] --> B[Camera Kiosk phát hiện khuôn mặt & Kiểm tra Liveness]
    B --> C{Kiểm tra Liveness?}
    C -- Thất bại (Ảnh tĩnh/Video) --> D[Ghi log verification_result = liveness_failed]
    D --> E[Màn hình Kiosk hiển thị cảnh báo Giả mạo]
    C -- Thành công --> F[AI trên Kiosk trích xuất Vector khuôn mặt]
    F --> G[So khớp với Cache Vector trong SQLite Local của Kiosk]
    G --> H{Điểm tin cậy >= face_match_threshold?}
    
    H -- KHÔNG KHỚP --> I[Ghi log result = no_match]
    I --> J{Đã thử quá max_face_retries lần?}
    J -- Chưa quá --> B
    J -- Đã vượt quá --> K[Yêu cầu nhập mã dự phòng PIN/QR attendance_fallback_codes]
    K --> L{Mã PIN/QR hợp lệ & chưa dùng?}
    L -- Sai/Hết hạn --> M[Báo lỗi Chấm công Thất bại]
    L -- Đúng --> N[Xác nhận danh tính Nhân viên]
    
    H -- KHỚP THÀNH CÔNG --> N[Xác nhận danh tính Nhân viên]
    N --> O[Tạo bản ghi face_verification_logs với idempotency_key]
    O --> P[Tạo sự kiện attendance_events: check_in / check_out]
    P --> Q{Kiosk có Mạng Internet?}
    Q -- Mất Mạng (Offline) --> R[Lưu sự kiện vào Offline Queue SQLite local với synced=false]
    Q -- Có Mạng (Online) --> S[Gửi API về Cloud Server & Đẩy Event vào Redis Queue]
    S --> T[Kiosk hiển thị: Chấm công Thành công + Giờ quẹt]
    R --> T
```

---

### **2.4. Flowchart 4: Luồng Động cơ Tính công Ngày Tự động (Daily Summary Engine)**

```mermaid
flowchart TD
    A[Sự kiện attendance_events được đẩy vào Redis Queue] --> B[Summary Worker nhặt sự kiện từ Queue]
    B --> C[Lấy thông tin Lịch ca shifts của Nhân viên trong ngày]
    C --> D[Lấy Cấu hình Ca mẫu shift_templates]
    D --> E[Xác định Giờ Check-in sớm nhất & Check-out muộn nhất]
    E --> F{Có đủ dữ liệu Check-in & Check-out?}
    
    F -- Thiếu lượt quẹt --> G[Đánh dấu status = absent hoặc Cảnh báo thiếu công]
    F -- Đủ lượt quẹt --> H[Tính Phút Đi Muộn: max 0, CheckIn - StartTime - AllowLate]
    H --> I[Tính Phút Về Sớm: max 0, EndTime - CheckOut - AllowEarly]
    I --> J[Tính Số giờ làm thực tế actual_work_hours trừ giờ nghỉ trưa]
    J --> K[Tính Số giờ Tăng ca overtime_hours nếu có]
    K --> L[Đối chiếu đơn nghỉ phép approved & Ngày lễ holidays]
    L --> M[Gán Status cuối: present / late / leave / holiday / off]
    M --> N[Lưu/Cập nhật bản ghi daily_attendance_summaries với rebuilt_at]
    N --> O[Kết thúc Job tính công ngày]
```

---

### **2.5. Flowchart 5: Luồng Xin & Duyệt Nghỉ Phép (Leave Request Workflow)**

```mermaid
flowchart TD
    A[Nhân viên mở App di động tạo Đơn nghỉ phép] --> B[Chọn Loại phép, Ngày nghỉ, Số ngày duration_days, Lý do]
    B --> C[Hệ thống đọc employee_leave_balances của năm hiện tại]
    C --> D{Số ngày xin <= remaining_days?}
    
    D -- Không đủ ngày phép --> E[Hiển thị thông báo Quỹ phép còn lại không đủ]
    D -- Đủ ngày phép --> F[Tạo đơn leave_requests với status = pending]
    F --> G[Tăng số ngày pending_days trong employee_leave_balances]
    G --> H[Gửi Notification thông báo tới Quản lý Chi nhánh]
    H --> I[Quản lý mở Portal/App xem chi tiết đơn xin nghỉ]
    I --> J{Quản lý ra quyết định?}
    
    J -- Từ chối (Reject) --> K[Cập nhật status = rejected]
    K --> L[Giảm pending_days trả về như cũ]
    L --> M[Gửi Notification Từ chối cho Nhân viên]
    
    J -- Duyệt (Approve) --> N[Cập nhật status = approved]
    N --> O[Giảm pending_days, Tăng used_days, Cập nhật remaining_days]
    O --> P[Tự động cập nhật status = leave trong daily_attendance_summaries]
    P --> Q[Gửi Notification Duyệt thành công cho Nhân viên]
```

---

### **2.6. Flowchart 6: Luồng Tính Lương Cuối Kỳ, Sửa Lương, Khiếu Nại & Chốt Lương (Payroll Workflow)**

```mermaid
flowchart TD
    A[Cuối tháng: Kế toán mở Portal bấm 'Chạy Tính Lương Tháng'] --> B[Tạo bản nháp payroll_records status = draft]
    B --> C[Lặp qua từng Nhân viên trong Chi nhánh/Tenant]
    C --> D[Lấy Lương cơ bản & Đơn vị tính pay_basis từ employee_compensation_history]
    D --> E[Đọc toàn bộ daily_attendance_summaries trong tháng]
    E --> F[Tính Lương cơ bản theo pay_basis: hourly / daily / shift / monthly]
    F --> G[Tính Tiền Phạt đi muộn/về sớm từ payroll_policies]
    G --> H[Tính Tiền Lương Tăng ca OT theo Hệ số chính sách]
    H --> I[Tính Tiền Khấu trừ Bảo hiểm xã hội & Thuế TNCN lũy tiến]
    I --> J[Tạo các dòng chi tiết payroll_line_items]
    J --> K[Tính Gross Amount, Total Deductions, Net Amount]
    K --> L[Cập nhật status payroll_records = pending_review]
    L --> M[Nhân viên mở App di động xem Bảng lương tạm tính]
    M --> N{Nhân viên có Khiếu nại?}
    
    N -- Có khiếu nại --> O[Tạo bản ghi payroll_disputes với status = open]
    O --> P[Kế toán kiểm tra & Giải quyết khiếu nại]
    P --> Q[Kế toán điều chỉnh lương thủ công -> Lưu snapshot trước/sau vào payroll_adjustments]
    
    N -- Không khiếu nại / Đã sửa xong --> R[Quản lý duyệt bảng lương -> status = reviewed]
    R --> S[Kế toán bấm CHỐT LƯƠNG -> status = locked]
    S --> T[Khóa bảo vệ CSDL công & lương kỳ này, Gửi Notification hoàn tất]
```

---

### **2.7. Flowchart 7: Luồng Kết xuất Báo cáo File Bất đồng bộ (Async Export Job)**

```mermaid
flowchart TD
    A[User bấm Xuất báo cáo Lương/Chấm công Excel] --> B[Tạo bản ghi export_jobs với status = pending]
    B --> C[Trả về Job ID ngay lập tức cho UI hiển thị spinner Loading]
    C --> D[Đẩy Job vào Redis BullMQ Queue xử lý ngầm]
    D --> E[Export Worker nhặt Job từ Queue]
    E --> F[Cập nhật status export_jobs = processing]
    F --> G[Truy vấn dữ liệu từ DB theo Bộ lọc Filters]
    G --> H[Gen file Excel / PDF và Upload lên Cloud S3 Storage]
    H --> I[Lưu file_url và cập nhật status = completed với completed_at]
    I --> J[Gửi Notification thông báo File đã sẵn sàng]
    J --> K[User bấm vào Notification để Tải file Excel/PDF về máy]
```

---
*Tài liệu Sơ đồ Luồng Nghiệp vụ (Flowcharts) này được lưu trực tiếp tại thư mục d:\UTT\ để phục vụ phát triển ứng dụng.*
