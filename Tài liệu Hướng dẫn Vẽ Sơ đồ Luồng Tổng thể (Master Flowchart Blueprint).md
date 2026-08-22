# HƯỚNG DẪN CHI TIẾT KHỐI & LUỒNG ĐỂ VẼ FLOWCHART TOÀN BỘ HỆ THỐNG
#(MASTER FLOWCHART BLUEPRINT)

---

Tài liệu này được biên soạn dưới dạng **Kịch bản từng bước (Step-by-Step Execution Guide)** giúp bạn tự vẽ sơ đồ luồng tổng thể (End-to-End Flowchart) từ lúc **Doanh nghiệp đăng ký hệ thống** cho tới khi **Chấm công hàng ngày, Xin nghỉ phép và Chốt sổ lương cuối tháng**.

---

## 📐 CÁC KÝ HIỆU CHUẨN KHI VẼ FLOWCHART (FLOWCHART SYMBOLS)

*   **Hình OVAL (Bắt đầu / Kết thúc):** Điểm đầu và điểm cuối của từng phân luồng.
*   **Hình CHỮ NHẬT (Tiến trình / Xử lý - Process):** Các bước thực hiện tính toán, tạo bản ghi, gửi notification.
*   **Hình THOI (Điều kiện / Rẽ nhánh - Decision):** Các điểm kiểm tra Đúng/Sai (Yes/No).
*   **Hình HÌNH BÌNH HÀNH (Đầu vào / Đầu ra - Input/Output):** Nhập form, hiển thị màn hình, xuất file.
*   **Hình HÌNH TRỤ (Cơ sở dữ liệu - Database):** Nơi lưu trữ/đọc bản ghi trong DB.

---

## 🗺️ BẢN THIẾT KẾ 6 GIAI ĐOẠN LIÊN THÔNG (END-TO-END STAGES)

---

### GIAI ĐOẠN 1: ĐĂNG KÝ DOANH NGHIỆP & THIẾT LẬP BAN ĐẦU (TENANT ONBOARDING)

*   🟢 **[BẮT ĐẦU]**: Chủ doanh nghiệp (Owner) truy cập trang web Đăng ký.
*   📥 **[NHẬP DỮ LIỆU]**: Nhập thông tin Công ty: Tên công ty, Họ tên Chủ DN, Email Admin, Mật khẩu, Số điện thoại.
*   ⚙️ **[XỬ LÝ - TRANSACTION]**: Backend tự động tạo 5 bản ghi CSDL liên hoàn:
    1.  Tạo Tenant mới trong bảng `tenants`.
    2.  Tạo Cấu hình `tenant_settings` (ngưỡng khuôn mặt `threshold = 0.85`, số lần thử `max_retries = 3`).
    3.  Tạo Chi nhánh đầu tiên trong `branches` ("Trụ sở chính", `timezone = 'Asia/Ho_Chi_Minh'`, `currency = 'VND'`).
    4.  Tạo Tài khoản người dùng trong `users`.
    5.  Cấp quyền Owner trong `user_branch_roles` (`role = 'owner'`, `branch_id = null`).
    *   ✅ **[VALIDATION]**: Kiểm tra email trùng (`users.email UNIQUE`) → trả lỗi 409 nếu đã tồn tại.
    *   🔐 **[PASSWORD HASH]**: Mật khẩu được băm bằng Argon2/Bcrypt trước khi lưu.
*   ⚙️ **[WIZARD 1 - PHÒNG BAN]**: Chủ doanh nghiệp tạo thêm Chi nhánh phụ & Phòng ban trong `departments` (Pha chế, Phục vụ, Kế toán...).
*   ⚙️ **[WIZARD 2 - CA MẪU]**: Khai báo Khung ca mẫu trong `shift_templates` (Giờ bắt đầu, Giờ kết thúc, Ca qua đêm `is_overnight`, số phút nghỉ trưa).
*   ⚙️ **[WIZARD 3 - NHÂN VIÊN & LƯƠNG]**: Nhập danh sách Nhân viên trong `employees` + Cài đặt Mức lương (`rate`) & Đơn vị tính lương (`pay_basis`: `hourly` / `daily` / `shift` / `monthly`) trong `employee_compensation_history`.
*   ⚙️ **[WIZARD 4 - PHÂN QUYỀN]**: Mời Quản lý (`manager`) và Kế toán (`accountant`) vào hệ thống qua Email (`user_branch_roles`).
*   ⚙️ **[WIZARD 5 - KIOSK]**: Đăng ký Thiết bị Kiosk (`kiosks`) đặt tại cửa hàng.
*   ➡️ **[CHUYỂN GIAI ĐOẠN]**: Chuyển sang **Giai đoạn 2**.

---

### GIAI ĐOẠN 2: THU THẬP SINH TRẮC HỌC & ĐỒNG BỘ VECTOR AI

*   🟢 **[BẮT ĐẦU GĐ2]**: Nhân viên mới nhận việc (Onboarding).
*   📥 **[ĐỌC CAM KẾT]**: Nhân viên đọc điều khoản Bảo mật dữ liệu sinh trắc học trên Kiosk/App.
*   ❓ **[ĐIỀU KIỆN 1]**: Nhân viên có bấm **Đồng ý**?
    *   🔴 **[NẾU KHÔNG]**: Ghi nhận Từ chối ➔ Cấp Mã PIN/QR dự phòng trong `attendance_fallback_codes` ➔ **[ĐẾN GĐ3]**.
    *   🟢 **[NẾU CÓ]**: Lưu bản ghi Cam kết trong `biometric_consents` (`consented_at = NOW()`).
*   📷 **[CHỤP ẢNH]**: Kiosk chụp 3 góc mặt (Chính diện, Nghiêng trái, Nghiêng phải).
    *   📊 **[KIỂM TRA CHẤT LƯỢNG ẢNH]**: Đánh giá độ sáng, độ nét, không bị che mặt → Nếu không đạt `face_quality_threshold` → Yêu cầu chụp lại (tối đa 3 lần).
*   ⚙️ **[TRÍCH XUẤT AI]**: AI Engine trích xuất Vector đặc trưng 128d/512d (`descriptor`) + nhãn phiên bản AI (`model_version`).
*   💾 **[LƯU DB CLOUD]**: Lưu mẫu vector vào bảng `face_embedding_samples`.
*   🔄 **[ĐỒNG BỘ LOCAL]**: Server đẩy Vector mẫu xuống CSDL SQLite Local của Kiosk tại Chi nhánh tương ứng.
*   ➡️ **[CHUYỂN GIAI ĐOẠN]**: Chuyển sang **Giai đoạn 3**.

---

### GIAI ĐOẠN 3: PHÂN CA & CHẤM CÔNG HÀNG NGÀY (TIME & ATTENDANCE)

*   📅 **[XẾP CA]**: Quản lý chi nhánh tạo lịch phân ca `shifts` cho nhân viên (Hỗ trợ xếp ca tại chi nhánh gốc hoặc phân ca tạm thời sang chi nhánh khác).
    *   📊 **[TRẠNG THÁI CA]**: `shift_status` có các trạng thái `draft`, `published`, `confirmed`, `in_progress`, `completed`, `cancelled`. Transition tự động dựa trên thời gian và sự kiện chấm công.
    *   📅 **[NHIỀU CA TRONG NGÀY]**: Hệ thống cho phép tạo nhiều `shifts` cho cùng `employee_id` trong cùng ngày, với unique constraint `employee_id + date + shift_id`. Kiểm tra xung đột khi tạo.
*   🧍 **[NHÂN VIÊN ĐẾN LÀM]**: Nhân viên đứng trước Kiosk tại cửa hàng.
*   👁️ **[KIỂM TRA AI]**: Kiosk kiểm tra Liveness (chống ảnh tĩnh/video) & trích xuất Vector hiện tại.
*   🔍 **[SO KHỚP LOCAL]**: Kiosk đối chiếu Vector hiện tại với SQLite Local trong máy Kiosk.
*   ❓ **[ĐIỀU KIỆN 2]**: Điểm tin cậy có `>= face_match_threshold` (0.85)?
    *   🔴 **[NẾU KHÔNG KHỚP]**: Ghi log `verification_result = 'no_match'`.
        *   ❓ **[ĐIỀU KIỆN 2.1]**: Đã thử quá `max_face_retries` (3 lần)?
            *   *Chưa quá:* Quay lại bước [CHỤP ẢNH].
            *   *Quá 3 lần:* Yêu cầu nhân viên gõ Mã PIN / Quét QR dự phòng (`attendance_fallback_codes`).
    *   🟢 **[NẾU KHỚP / PIN ĐÚNG]**: Xác nhận danh tính Nhân viên ➔ Tạo bản ghi `face_verification_logs` với `idempotency_key`.
*   📝 **[TẠO EVENT CHẤM CÔNG]**: Tạo bản ghi trong `attendance_events` (`event_type`: `check_in` / `check_out` / `break_start` / `break_end`).
    *   🛠️ **[MANAGER ADJUST]**: Khi quản lý chỉnh sửa, tạo `attendance_events` với `event_type='manager_adjust'` và `adjust_reason`. Không UPDATE, chỉ INSERT để giữ audit trail.
    *   ⏱️ **[THỜI GIAN]**: Ghi `occurred_at` (thời điểm quẹt thực tế) và `recorded_at` (thời điểm server nhận) để so sánh độ trễ.
*   ❓ **[ĐIỀU KIỆN 3]**: Kiosk có kết nối Mạng Internet?
    *   🔴 **[MẤT MẠNG - OFFLINE]**: Lưu sự kiện vào Hàng đợi SQLite Local (`synced = false`). Kiosk báo *"Chấm công Offline thành công"*. Khi có mạng lại ➔ Tiến trình ngầm tự động đẩy Batch Sync về Cloud Server với `idempotency_key`.
    *   🟢 **[CÓ MẠNG - ONLINE]**: Đẩy ngay về Cloud Server ➔ Đẩy sự kiện vào Redis Message Queue.
*   ➡️ **[CHUYỂN GIAI ĐOẠN]**: Chuyển sang **Giai đoạn 4**.

---

### GIAI ĐOẠN 4: ĐỘNG CƠ TỔNG HỢP CÔNG NGÀY TỰ ĐỘNG (DAILY SUMMARY ENGINE)

*   ⚙️ **[WORKER THU THẬP]**: Summary Worker nhặt sự kiện `attendance_events` từ Redis Queue.
*   📖 **[ĐỌC LỊCH CA]**: Đọc Lịch ca `shifts` và Cấu hình Ca mẫu `shift_templates` trong ngày của nhân viên.
*   🔍 **[TÍNH TOÁN CÔNG]**:
    1.  Xác định Giờ vào sớm nhất `first_check_in` & Giờ ra muộn nhất `last_check_out`.
    2.  Tính Số phút đi muộn `late_minutes` (vượt quá `allow_late_minutes`).
    3.  Tính Số phút về sớm `early_leave_minutes` (vượt quá `allow_early_leave_minutes`).
    4.  Tính Số giờ làm thực tế `actual_work_hours` (trừ số phút nghỉ trưa `break_duration_minutes`).
    5.  Tính Số giờ làm thêm `overtime_hours` (OT).
*   📖 **[ĐỐI CHIẾU NGHỈ/LỄ]**: Đọc đơn nghỉ phép được duyệt `leave_requests` & Ngày lễ `holidays`.
*   🏷️ **[GÁN TRẠNG THÁI]**: Gán `status` công ngày (`present`: có mặt, `late`: đi muộn, `absent`: vắng, `leave`: nghỉ phép, `holiday`: nghỉ lễ, `off`: nghỉ tuần).
*   💾 **[LƯU CSDL]**: Ghi/Cập nhật bản ghi vào `daily_attendance_summaries` với `rebuilt_at = NOW()`.
*   ➡️ **[CHUYỂN GIAI ĐOẠN]**: Chuyển sang **Giai đoạn 5** hoặc **Giai đoạn 6**.

---

### GIAI ĐOẠN 5: LUỒNG XIN & DUYỆT NGHỈ PHÉP (LEAVE WORKFLOW)

*   📱 **[TẠO ĐƠN]**: Nhân viên mở App di động tạo Đơn nghỉ phép (`leave_requests`: Chọn loại phép, Ngày bắt đầu, Ngày kết thúc, Số ngày `duration_days`, Lý do).
*   🔍 **[ĐỌC QUỸ PHÉP]**: Hệ thống đọc số ngày phép còn lại `remaining_days` trong `employee_leave_balances`.
*   ❓ **[ĐIỀU KIỆN 4]**: Số ngày xin `duration_days <= remaining_days`?
    *   🔴 **[KHÔNG ĐỦ]**: Hiển thị thông báo Lỗi: "Quỹ phép còn lại không đủ" ➔ Dừng luồng.
    *   🟢 **[ĐỦ PHÉP]**: Lưu đơn `leave_requests` với `status = 'pending'`, tăng `pending_days` ➔ Gửi Notification tới Quản lý Chi nhánh.
    *   ⚠️ **[KIỂM TRA TRÙNG]**: Kiểm tra `leave_requests` có thời gian giao nhau với các đơn đang `pending`/`approved` khác của cùng nhân viên. Nếu trùng → từ chối và thông báo.
*   👔 **[QUẢN LÝ XEM DỰỆT]**: Quản lý mở Portal xem chi tiết đơn.
*   ❓ **[ĐIỀU KIỆN 5]**: Quản lý ra Quyết định?
    *   🔴 **[TỪ CHỐI - REJECT]**: Đổi `status = 'rejected'` ➔ Giảm `pending_days` về như cũ ➔ Gửi Notification cho Nhân viên.
    *   🟢 **[ĐỒNG Ý - APPROVE]**: Đổi `status = 'approved'` ➔ Giảm `pending_days`, tăng `used_days`, tự động tính lại `remaining_days`.
*   🔄 **[CẬP NHẬT CÔNG]**: Tự động kích hoạt rebuild `daily_attendance_summaries` trong các ngày nghỉ thành `status = 'leave'` ➔ Gửi Notification Duyệt thành công cho Nhân viên.

---

### GIAI ĐOẠN 6: ĐỘNG CƠ TÍNH LƯƠNG CUỐI KỲ, KHIẾU NẠI & CHỐT LƯƠNG (PAYROLL ENGINE)

*   📅 **[BẮT ĐẦU CHẠY LƯƠNG]**: Cuối tháng, Kế toán mở Web Portal chọn Kỳ lương (VD: `2026-07`) và bấm **"Kích Hoạt Tính Lương"**.
*   ⚙️ **[PAYROLL WORKER]**: Worker khởi tạo bản ghi nháp `payroll_records` (`status = 'draft'`).
*   📖 **[ĐỌC DỮ LIỆU ĐẦU VÀO]**:
    1.  Đọc Lương cơ bản `rate` & Đơn vị tính `pay_basis` (`hourly` / `daily` / `shift` / `monthly`) từ `employee_compensation_history`.
    2.  Đọc toàn bộ bảng công `daily_attendance_summaries` của nhân viên trong tháng.
    3.  Đọc Chính sách lương/phạt từ `payroll_policies`.
*   🧮 **[TÍNH TOÁN TIỀN BẠC]**:
    *   *Tính Lương chính:* Theo đúng công thức của `pay_basis` (Giờ/Ngày/Ca/Tháng).
    *   *Tính Thưởng OT:* Tổng giờ OT × Hệ số OT (x1.5, x2.0).
    *   *Tính Tiền Phạt:* Phút đi muộn/về sớm × Tỷ lệ phạt.
    *   *Tính Bảo hiểm xã hội:* Khấu trừ % BHXH (`social_insurance_amount`).
    *   *Tính Thuế TNCN:* Áp dụng biểu thuế lũy tiến (`tax_amount`).
*   📝 **[TẠO LINE ITEMS]**: Tạo các dòng chi tiết trong `payroll_line_items` (Base salary, Allowance, Bonus, Penalty, Insurance, Tax) ➔ Tính toán `gross_amount`, `total_deductions`, `net_amount`.
*   🏷️ **[ĐỔI TRẠNG THÁI]**: Cập nhật `payroll_records.status = 'pending_review'` ➔ Gửi Notification cho Nhân viên xem phiếu lương tạm tính trên App.
*   ❓ **[ĐIỀU KIỆN 6]**: Nhân viên có Khiếu nại về Bảng lương?
    *   🟢 **[CÓ KHIẾU NẠI]**: Nhân viên tạo đơn khiếu nại `payroll_disputes` (`status = 'open'`). Kế toán kiểm tra, nếu sửa lương thủ công ➔ Hệ thống lưu Snapshot trước/sau vào `payroll_adjustments`.
    *   🔴 **[KHÔNG KHIẾU NẠI / ĐÃ SỬA XONG]**: Quản lý duyệt bảng lương ➔ Đổi `status = 'reviewed'`.
*   🔒 **[CHỐT LƯƠNG - LOCKED]**: Kế toán bấm **"CHỐT LƯƠNG"** ➔ Cập nhật `payroll_records.status = 'locked'`.
*   🛡️ **[BẢO VỆ CSDL]**: Khóa vĩnh viễn dữ liệu công & lương kỳ này (Append-only). Gửi Notification thông báo Phiếu lương chính thức ➔ Cho phép xuất file Excel/PDF chi trả ngân hàng qua `export_jobs`.
    *   📤 **[EXPORT JOB]**: Khi người dùng nhấn “Export”, tạo bản ghi trong `export_jobs` → Worker async tạo file Excel/PDF → Khi hoàn thành gửi Notification và lưu đường link.
*   🔴 **[KẾT THÚC QUY TRÌNH TOÀN HỆ THỐNG]**.

---

### 🎨 GỢI Ý MẸO VẼ SƠ ĐỒ KHI DÙNG DRAW.IO / LUCIDCHART:
1. Chia canvas thành **6 Khối làn bơi (Swimlanes)** tương ứng với 6 Giai đoạn trên.
2. Dùng màu sắc khác nhau cho từng phân hệ (VD: *Xanh lá cho Chấm công, Xanh dương cho Nghỉ phép, Vàng cho Tính lương*).
3. Đặt các Điểm rẽ nhánh Hình Thoi (Decision 1 đến 6) ở giữa các làn để thể hiện luồng chạy cực kỳ logic và chuyên nghiệp!
