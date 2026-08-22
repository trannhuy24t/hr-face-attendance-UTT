# Từ Điển Dữ Liệu & Phân Tích Nghiệp Vụ Chi Tiết Từng Cột (Data Dictionary)
Tài liệu này phân tích chi tiết **từng bảng** và **từng cột dữ liệu (Column-level)** trong hệ thống Quản lý Nhân sự, Chấm công Sinh trắc học và Tính lương Multi-Tenant.
## 1\. Phân hệ Quản trị & Cấu trúc Tổ chức (Organization)
### 1\.1. Bảng `tenants` (Tổ chức / Công ty)
Bảng lưu trữ các doanh nghiệp đăng ký sử dụng nền tảng (Đa khách thuê).

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã định danh duy nhất cho tổ chức/công ty.|
|`name`|varchar|Not Null|Tên pháp lý hoặc tên thương hiệu của tổ chức/công ty.|
|`created_at`|timestamp|Not Null|Thời điểm công ty tạo tài khoản trên nền tảng.|

-----
### 1\.2. Bảng `tenant_settings` (Cấu hình Tổ chức)
Bảng lưu các tham số cấu hình riêng biệt cho từng Tenant.

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã định danh cấu hình.|
|`tenant_id`|uuid|FK -> `tenants.id` (1-1)|Liên kết 1-1 với công ty chủ quản.|
|`face_match_threshold`|decimal|Not Null|Độ tin cậy tối thiểu (VD: 0.85 tương đương 85%) để công nhận 2 khuôn mặt khớp nhau.|
|`max_face_retries`|int|Not Null|Số lần Kiosk cho phép thử quẹt mặt lại trước khi chuyển sang nhập mã PIN/QR.|

-----
### 1\.3. Bảng `branches` (Chi nhánh / Văn phòng)
Bảng quản lý danh sách các chi nhánh của công ty.

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã định danh chi nhánh.|
|`tenant_id`|uuid|FK -> `tenants.id`|Chi nhánh này thuộc về công ty nào.|
|`name`|varchar|Not Null|Tên chi nhánh (VD: Chi nhánh Quận 1, Văn phòng Hà Nội).|
|`timezone`|varchar|Not Null|Múi giờ đại diện cho chi nhánh (VD: `Asia/Ho_Chi_Minh`), dùng để tính công chính xác.|
|`currency`|varchar|Not Null|Đơn vị tiền tệ chính dùng cho chi nhánh (VD: `VND`, `USD`).|
|`weekly_off_days`|json|Nullable|Lưu mảng ngày nghỉ cố định trong tuần dạng JSON (VD: `["Saturday", "Sunday"]`).|
|`created_at`|timestamp|Not Null|Ngày khởi tạo chi nhánh.|
|`deleted_at`|timestamp|Nullable|Thời điểm xóa mềm chi nhánh (Soft Delete).|

### 1\.4. Bảng `departments` (Phòng ban / Bộ phận)
Bảng quản lý cơ cấu phòng ban trong từng chi nhánh.

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã định danh phòng ban.|
|`tenant_id`|uuid|FK -> `tenants.id`|Định danh Tenant chủ quản.|
|`branch_id`|uuid|FK -> `branches.id`|Phòng ban này thuộc chi nhánh nào.|
|`name`|varchar|Not Null|Tên phòng ban (VD: Phòng Kế Toán, Bộ Phận Lập Trình).|
|`code`|varchar|Not Null|Mã ngắn gọn đại diện phòng ban (VD: `IT`, `HR`, `ACC`).|
|`created_at`|timestamp|Not Null|Ngày tạo bản ghi phòng ban.|

### 1\.5. Bảng `holidays` (Ngày lễ / Ngày nghỉ toàn quốc & công ty)

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã ngày lễ.|
|`tenant_id`|uuid|FK -> `tenants.id` (Nullable)|Nếu null là ngày lễ hệ thống, nếu có giá trị là ngày lễ riêng của công ty.|
|`branch_id`|uuid|FK -> `branches.id` (Nullable)|Nếu có giá trị là ngày lễ chỉ áp dụng cho chi nhánh đó.|
|`name`|varchar|Not Null|Tên ngày lễ (VD: Tết Nguyên Đán, Quốc Khánh 2/9).|
|`start_date`|date|Not Null|Ngày bắt đầu đợt nghỉ lễ.|
|`end_date`|date|Not Null|Ngày kết thúc đợt nghỉ lễ.|
|`created_at`|timestamp|Not Null|Ngày tạo dữ liệu ngày lễ.|

## 2\. Phân hệ Quản lý Nhân sự & Tài khoản (Employees & Users)
### 2\.1. Bảng `employees` (Hồ sơ Nhân viên)

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã UUID hệ thống của nhân viên.|
|`tenant_id`|uuid|FK -> `tenants.id`|Thuộc công ty nào.|
|`branch_id`|uuid|FK -> `branches.id`|Làm việc tại chi nhánh nào.|
|`department_id`|uuid|FK -> `departments.id` (Nullable)|Thuộc phòng ban/bộ phận nào.|
|`employee_code`|varchar|Not Null, Unique|Mã nhân viên nghiệp vụ (VD: `NV001`, `EMP102`) dùng để trao đổi & làm lương.|
|`status`|enum|Not Null|Trạng thái nhân sự: `active` (đang làm), `probation` (thử việc), `suspended` (đình chỉ), `terminated` (đã nghỉ).|
|`full_name`|varchar|Not Null|Họ và tên đầy đủ của nhân viên.|
|`termination_date`|date|Nullable|Ngày chính thức ngưng hợp đồng/nghỉ việc.|
|`created_at`|timestamp|Not Null|Ngày hồ sơ được tạo.|
|`updated_at`|timestamp|Not Null|Lần cuối cập nhật thông tin nhân viên.|
|`deleted_at`|timestamp|Nullable|Xóa mềm hồ sơ nhân viên.|

### 2\.2. Bảng `employee_compensation_history` (Lịch sử Lương & Hợp đồng)

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã định danh bản ghi mức lương.|
|`tenant_id`|uuid|FK -> `tenants.id`|Thuộc Tenant.|
|`branch_id`|uuid|FK -> `branches.id`|Thuộc chi nhánh.|
|`employee_id`|uuid|FK -> `employees.id`|Nhân viên sở hữu mức lương này.|
|`contract_type`|varchar|Not Null|Loại hợp đồng (VD: `full_time`, `part_time`, `internship`).|
|`rate`|decimal|Not Null|Mức lương cơ bản (Theo giờ hoặc theo tháng tùy cấu hình).|
|pay\_basis|enum|Not Null|Đơn vị tính lương: hourly (theo giờ), daily (theo ngày), shift (theo ca), monthly (theo tháng).|
|`effective_from`|date|Not Null|Ngày mức lương này bắt đầu có hiệu lực.|
|`effective_to`|date|Nullable|Ngày hết hiệu lực (Null nghĩa là đang áp dụng hiện tại).|
|`created_at`|timestamp|Not Null|Ngày tạo bản ghi lịch sử lương.|

### 2\.3. Bảng `users` (Tài khoản Đăng nhập Portal)

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã định danh tài khoản người dùng.|
|`tenant_id`|uuid|FK -> `tenants.id`|Thuộc công ty nào.|
|`employee_id`|uuid|FK -> `employees.id` (1-1, Nullable)|Liên kết với hồ sơ nhân viên. (Null nếu tài khoản là Admin toàn hệ thống).|
|`email`|varchar|Not Null, Unique|Email đăng nhập vào hệ thống.|
|`full_name`|varchar|Not Null|Họ và tên của chủ tài khoản.|
|`phone`|varchar|Nullable|Số điện thoại liên hệ bảo mật.|
|`password_hash`|varchar|Not Null|Chuỗi mật khẩu đã được mã hóa (Argon2 / Bcrypt).|
|`password_reset_token`|varchar|Nullable|Mã Token băm để khôi phục mật khẩu khi quên.|
|`password_reset_expires`|timestamp|Nullable|Thời hạn sống của Token khôi phục mật khẩu.|
|`refresh_token_hash`|varchar|Nullable|Bản băm SHA-256 của Refresh Token hiện tại. Dùng để xác minh và xoay vòng token (Token Rotation).|
|`created_at`|timestamp|Not Null|Ngày tạo tài khoản.|
|`deleted_at`|timestamp|Nullable|Thời điểm vô hiệu hóa/xóa tài khoản.|

### 2\.4. Bảng `auth_sessions` (Phiên Đăng Nhập & Multi-Device)
Bảng quản lý các phiên đăng nhập riêng biệt trên từng thiết bị của người dùng, hỗ trợ Token Rotation và thu hồi truy cập linh hoạt.

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã định danh phiên (Tương ứng với `sid` trong Payload của Refresh Token).|
|`user_id`|uuid|FK -> `users.id`|Tài khoản sở hữu phiên đăng nhập này.|
|`family_id`|uuid|Not Null|Mã Dòng họ Token. Khi người dùng refresh token, ID phiên có thể bị thay đổi, nhưng family_id giữ nguyên. Hỗ trợ dò tìm Token Reuse.|
|`refresh_token_hash`|varchar|Not Null|Bản băm SHA-256 của Refresh Token mới nhất thuộc phiên này.|
|`device_info`|varchar|Nullable|Thông tin User-Agent (Trình duyệt, Hệ điều hành, App Mobile) của thiết bị.|
|`ip_address`|varchar|Nullable|Địa chỉ IP lúc đăng nhập/tạo phiên.|
|`expires_at`|timestamp|Not Null|Thời điểm Refresh Token hết hạn (Thường là 7 ngày kể từ lúc cấp).|
|`last_used_at`|timestamp|Nullable|Lần cuối cùng dùng Refresh Token để xin cấp lại token.|
|`revoked_at`|timestamp|Nullable|Thời điểm phiên đăng nhập bị thu hồi (Đăng xuất hoặc bị ép văng).|
|`revoked_reason`|varchar|Nullable|Lý do thu hồi (VD: `logout`, `token_reuse`, `logout_all`).|
|`created_at`|timestamp|Not Null|Ngày thiết bị này bắt đầu đăng nhập.|

### 2\.5. Bảng `user_branch_roles` (Phân quyền Quản trị theo Chi nhánh)

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã phân quyền.|
|`user_id`|uuid|FK -> `users.id`|Tài khoản được phân quyền.|
|`branch_id`|uuid|FK -> `branches.id` (Nullable)|Chi nhánh được giao quyền (Null nếu có quyền trên toàn bộ chi nhánh).|
|`role`|enum|Not Null|Vai trò: `owner` (Chủ), `manager` (Quản lý), `accountant` (Kế toán), `staff` (Nhân viên).|
|`created_at`|timestamp|Not Null|Ngày phân quyền.|

## 3\. Phân hệ Sinh trắc học & Thiết bị Kiosk (Biometrics)
### 3\.1. Bảng `biometric_consents` (Cam kết Đồng ý Sinh trắc học)

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã bản ghi cam kết.|
|`employee_id`|uuid|FK -> `employees.id`|Nhân viên thực hiện xác nhận đồng ý.|
|`consented_at`|timestamp|Not Null|Thời điểm ký/bấm xác nhận đồng ý cung cấp khuôn mặt.|
|`revoked_at`|timestamp|Nullable|Thời điểm thu hồi quyền sử dụng dữ liệu khuôn mặt (nếu có).|

### 3\.2. Bảng `biometric_deletion_logs` (Nhật ký Xóa Dữ liệu Sinh trắc học)

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã log xóa.|
|`employee_id`|uuid|FK -> `employees.id`|Nhân viên có dữ liệu bị xóa.|
|`deleted_at`|timestamp|Not Null|Thời điểm dữ liệu khuôn mặt bị xóa khỏi hệ thống.|
|`reason`|varchar|Not Null|Lý do xóa (VD: `Employee Resigned`, `Consent Revoked`).|

### 3\.3. Bảng `face_embedding_samples` (Vector Mẫu Khuôn mặt AI)

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã mẫu vector.|
|`employee_id`|uuid|FK -> `employees.id`|Khuôn mặt của nhân viên nào.|
|`descriptor`|vector|Not Null|Dữ liệu Vector đặc trưng toán học của khuôn mặt do AI trích xuất.|
|`model_version`|varchar|Not Null|Phiên bản model AI (VD: `insightface-v1`) để quản lý tương thích.|
|`angle_label`|varchar|Not Null|Nhãn góc chụp khuôn mặt (VD: `front`, `left_45`, `right_45`).|
|`created_at`|timestamp|Not Null|Ngày đăng ký mẫu khuôn mặt.|

### 3\.4. Bảng `kiosks` (Máy chấm công Kiosk)

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã định danh thiết bị Kiosk.|
|`tenant_id`|uuid|FK -> `tenants.id`|Thuộc công ty nào.|
|`branch_id`|uuid|FK -> `branches.id`|Đặt tại chi nhánh nào.|
|`device_name`|varchar|Not Null|Tên đặt cho thiết bị (VD: `Kiosk Cổng Chính Tầng 1`).|
|`status`|enum|Not Null|Trạng thái Kiosk: `active` (đang chạy), `inactive` (tắt), `flagged` (lỗi/nghi vấn).|
|`last_seen_at`|timestamp|Nullable|Lần cuối Kiosk gửi tín hiệu ping/heartbeat về máy chủ.|
|`created_at`|timestamp|Not Null|Ngày tạo thiết bị trên hệ thống.|
|`deleted_at`|timestamp|Nullable|Xóa thiết bị khỏi hệ thống.|

### 3\.5. Bảng `face_verification_logs` (Nhật ký Xác thực Khuôn mặt)

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã log xác thực.|
|`branch_id`|uuid|FK -> `branches.id`|Chi nhánh diễn ra xác thực.|
|`kiosk_id`|uuid|FK -> `kiosks.id`|Kiosk nào đã nhận diện.|
|`employee_id`|uuid|FK -> `employees.id` (Nullable)|Nhân viên được nhận diện (Null nếu nhận diện thất bại/người lạ).|
|`result`|enum|Not Null|Kết quả: `matched` (thành công), `no_match` (không khớp), `liveness_failed` (ảnh/video giả mạo).|
|`confidence_score`|decimal|Not Null|Điểm độ tin cậy của thuật toán so khớp (VD: 0.94).|
|`idempotency_key`|varchar|Unique|Mã khóa chống nhận trùng 2 lần do mạng đơ/lag gửi lặp.|
|`occurred_at`|timestamp|Not Null|Thời điểm xảy ra quẹt mặt trên thiết bị Kiosk.|
|`recorded_at`|timestamp|Not Null|Thời điểm máy chủ nhận và lưu log vào CSDL.|

## 4\. Phân hệ Phân ca & Chấm công (Shifts & Attendance)
### 4\.1. Bảng `shift_templates` (Khung Ca Làm Việc Mẫu)

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã ca mẫu.|
|`branch_id`|uuid|FK -> `branches.id`|Áp dụng cho chi nhánh nào.|
|`name`|varchar|Not Null|Tên ca làm việc (VD: Ca Hành Chính, Ca Sáng, Ca Đêm).|
|`start_time`|time|Not Null|Giờ bắt đầu ca (VD: `08:00:00`).|
|`end_time`|time|Not Null|Giờ kết thúc ca (VD: `17:00:00`).|
|`is_overnight`|boolean|Not Null|`true` nếu ca chạy qua đêm (VD: 22h đêm tới 6h sáng hôm sau).|
|`break_duration_minutes`|int|Not Null|Số phút nghỉ giữa ca được trừ (VD: `60` phút ăn trưa).|
|`allow_late_minutes`|int|Not Null|Số phút đi muộn cho phép không bị tính lỗi (VD: `15` phút).|
|`allow_early_leave_minutes`|int|Not Null|Số phút về sớm cho phép không bị tính lỗi (VD: `5` phút).|
|`created_at`|timestamp|Not Null|Ngày tạo ca mẫu.|
|`deleted_at`|timestamp|Nullable|Xóa mềm ca mẫu.|

### 4\.2. Bảng `shifts` (Lịch Phân Ca Thực Tế)

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã bản ghi phân ca.|
|`tenant_id`|uuid|FK -> `tenants.id`|Định danh Tenant.|
|`branch_id`|uuid|FK -> `branches.id`|Chi nhánh tổ chức ca.|
|`employee_id`|uuid|FK -> `employees.id`|Nhân viên được phân ca này.|
|`shift_template_id`|uuid|FK -> `shift_templates.id` (Nullable)|Tạo từ ca mẫu nào (hoặc linh hoạt nhập tay).|
|`start_time`|timestamp|Not Null|Thời điểm bắt đầu ca cụ thể (Ngày + Giờ).|
|`end_time`|timestamp|Not Null|Thời điểm kết thúc ca cụ thể (Ngày + Giờ).|
|`status`|enum|Not Null|Trạng thái ca: `draft`, `published`, `confirmed`, `change_requested`, `in_progress`, `completed`, `cancelled`.|
|`confirmed_by`|uuid|FK -> `users.id` (Nullable)|Quản lý/Nhân viên xác nhận ca.|
|`created_at`|timestamp|Not Null|Ngày xếp ca.|
|`updated_at`|timestamp|Not Null|Lần cuối cập nhật lịch ca.|

### 4\.3. Bảng `attendance_events` (Sự kiện Bấm Công Thực Tế)

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã sự kiện bấm công.|
|`tenant_id`|uuid|FK -> `tenants.id`|Định danh Tenant.|
|`branch_id`|uuid|FK -> `branches.id`|Thuộc chi nhánh nào.|
|`employee_id`|uuid|FK -> `employees.id`|Nhân viên bấm công.|
|`shift_id`|uuid|FK -> `shifts.id` (Nullable)|Gắn với ca làm việc nào (nếu xác định được).|
|`verification_log_id`|uuid|FK -> `face_verification_logs.id` (Nullable)|Log quẹt mặt tương ứng (nếu bấm công bằng khuôn mặt).|
|`event_type`|enum|Not Null|Loại sự kiện: `check_in` (Vào), `check_out` (Ra), `break_start` (Nghỉ giữa giờ), `break_end` (Vào lại), `manager_adjust` (Sửa tay).|
|`method`|enum|Not Null|Phương thức: `face_id`, `qr_fallback`, `pin_fallback`.|
|`location`|json|Nullable|Tọa độ GPS/Vị trí chấm công (VD: `{"lat": 10.7, "long": 106.6}`).|
|`payload`|json|Not Null|Chứa dữ liệu mở rộng đi kèm của sự kiện.|
|`idempotency_key`|varchar|Unique|Khóa đảm bảo không bị ghi lặp sự kiện khi bấm nhiều lần liên tiếp.|
|`occurred_at`|timestamp|Not Null|Thời điểm xảy ra bấm công.|
|`recorded_at`|timestamp|Not Null|Thời điểm lưu vào DB Server.|

### 4\.4. Bảng `attendance_fallback_codes` (Mã PIN Dự Phòng)

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã định danh bản ghi PIN.|
|`employee_id`|uuid|FK -> `employees.id`|Mã này cấp cho nhân viên nào.|
|`code`|varchar|Not Null|Chuỗi mã PIN/OTP dùng để gõ vào Kiosk khi không chấm được bằng mặt.|
|`expires_at`|timestamp|Not Null|Thời điểm mã hết hạn sử dụng.|
|`used_at`|timestamp|Nullable|Thời điểm mã đã được sử dụng (Null nghĩa là chưa dùng).|

### 4\.5. Bảng `daily_attendance_summaries` (Bảng Tổng Hợp Công Ngày/Ca)

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã bản ghi tổng hợp công.|
|`tenant_id`|uuid|FK -> `tenants.id`|Định danh Tenant.|
|`branch_id`|uuid|FK -> `branches.id`|Chi nhánh.|
|`employee_id`|uuid|FK -> `employees.id`|Nhân viên.|
|`shift_id`|uuid|FK -> `shifts.id` (Nullable)|Ca làm việc được tổng hợp.|
|`date`|date|Not Null|Ngày tổng hợp công (YYYY-MM-DD).|
|`first_check_in`|timestamp|Nullable|Giờ bấm Check-in sớm nhất trong ca/ngày.|
|`last_check_out`|timestamp|Nullable|Giờ bấm Check-out muộn nhất trong ca/ngày.|
|`actual_work_hours`|decimal|Not Null|Số giờ làm việc thực tế tính được (đã trừ giờ nghỉ trưa).|
|`late_minutes`|int|Not Null|Số phút bị tính là đi muộn.|
|`early_leave_minutes`|int|Not Null|Số phút bị tính là về sớm.|
|`overtime_hours`|decimal|Not Null|Số giờ làm thêm (OT) được công nhận.|
|`status`|enum|Not Null|Trạng thái công: `present` (Có mặt), `absent` (Vắng), `late` (Muộn), `leave` (Phép), `holiday` (Lễ), `off` (Nghỉ tuần).|
|`rebuilt_at`|timestamp|Not Null|Thời điểm gần nhất hệ thống chạy job tính toán lại dòng dữ liệu này.|

## 5\. Phân hệ Quản lý Nghỉ phép (Leave Management)
### 5\.1. Bảng `leave_requests` (Đơn Xin Nghỉ Phép)

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã đơn xin nghỉ phép.|
|`tenant_id`|uuid|FK -> `tenants.id`|Định danh Tenant.|
|`branch_id`|uuid|FK -> `branches.id`|Chi nhánh của nhân viên.|
|`employee_id`|uuid|FK -> `employees.id`|Nhân viên làm đơn xin nghỉ.|
|`category`|enum|Not Null|Loại phép: `annual` (Thường niên), `sick` (Nghỉ ốm), `maternity` (Thai sản), `unpaid` (Không lương), `other` (Khác).|
|`is_paid`|boolean|Not Null|`true` nếu ngày nghỉ này vẫn được hưởng nguyên lương.|
|`start_date`|date|Not Null|Ngày bắt đầu nghỉ.|
|`end_date`|date|Not Null|Ngày kết thúc nghỉ.|
|`duration_days`|decimal|Not Null|Tổng số ngày xin nghỉ (VD: `1.0` ngày, `0.5` nửa ngày).|
|`status`|enum|Not Null|Trạng thái đơn: `draft`, `pending`, `approved`, `rejected`, `locked`.|
|`reason`|varchar|Not Null|Lý do viết đơn xin nghỉ.|
|`approved_by`|uuid|FK -> `users.id` (Nullable)|Tài khoản Quản lý đã bấm duyệt/từ chối đơn.|
|`created_at`|timestamp|Not Null|Ngày làm đơn.|
|`updated_at`|timestamp|Not Null|Ngày cập nhật đơn.|

### 5\.2. Bảng `employee_leave_balances` (Quỹ Phép Nhân Viên)

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã bản ghi quỹ phép.|
|`tenant_id`|uuid|FK -> `tenants.id`|Định danh Tenant.|
|`branch_id`|uuid|FK -> `branches.id`|Định danh Chi nhánh.|
|`employee_id`|uuid|FK -> `employees.id`|Nhân viên sở hữu quỹ phép.|
|`year`|int|Not Null|Năm quản lý quỹ phép (VD: `2026`).|
|`total_accrued`|decimal|Not Null|Tổng số ngày phép được tích lũy/cấp cho cả năm.|
|`used_days`|decimal|Not Null|Số ngày phép đã nghỉ và đã được duyệt.|
|`pending_days`|decimal|Not Null|Số ngày phép đang trong đơn chờ duyệt.|
|`remaining_days`|decimal|Not Null|Số ngày phép còn lại có thể dùng (`total_accrued - used_days - pending_days`).|
|`updated_at`|timestamp|Not Null|Lần cuối cập nhật lại số dư phép.|

## 6\. Phân hệ Tính Lương (Payroll Management)
### 6\.1. Bảng `payroll_policies` (Chính Sách Tính Lương & Phạt)

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã chính sách lương.|
|`tenant_id`|uuid|FK -> `tenants.id`|Áp dụng cho Tenant nào.|
|`type`|varchar|Not Null|Loại quy tắc (VD: `ot_multiplier_weekday`, `late_penalty_per_minute`).|
|`rate`|decimal|Not Null|Hệ số hoặc số tiền áp dụng (VD: `1.5` cho OT ngày thường, `2.0` ngày lễ).|
|`effective_from`|date|Not Null|Ngày quy tắc bắt đầu có hiệu lực.|
|`effective_to`|date|Nullable|Ngày hết hiệu lực quy tắc.|
|`created_at`|timestamp|Not Null|Ngày tạo chính sách.|

### 6\.2. Bảng `payroll_records` (Bảng Lương Tổng Của Nhân Viên)

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã bản ghi phiếu lương.|
|`tenant_id`|uuid|FK -> `tenants.id`|Định danh Tenant.|
|`branch_id`|uuid|FK -> `branches.id`|Chi nhánh của nhân viên.|
|`employee_id`|uuid|FK -> `employees.id`|Phiếu lương của nhân viên nào.|
|`period`|varchar|Not Null|Kỳ tính lương (VD: `2026-07` cho tháng 7/2026).|
|`status`|enum|Not Null|Trạng thái phiếu lương: `draft` (nháp), `pending_review` (chờ duyệt), `reviewed` (đã duyệt), `locked` (chốt/đã chi trả).|
|`gross_amount`|decimal|Not Null|Tổng thu nhập trước thuế & bảo hiểm.|
|`social_insurance_amount`|decimal|Not Null|Khấu trừ tiền Bảo hiểm xã hội / BHYT phần nhân viên đóng.|
|`tax_amount`|decimal|Not Null|Khấu trừ thuế Thu nhập cá nhân (TNCN).|
|`total_deductions`|decimal|Not Null|Tổng tất cả các khoản khấu trừ (Bảo hiểm + Thuế + Phạt đi muộn...).|
|`net_amount`|decimal|Not Null|Lương thực nhận của nhân viên (`gross_amount - total_deductions`).|
|`currency`|varchar|Not Null|Đơn vị tiền tệ của phiếu lương (VD: `VND`).|
|`created_by`|uuid|FK -> `users.id`|Kế toán/User đã kích hoạt chạy bảng lương.|
|`reviewed_by`|uuid|FK -> `users.id` (Nullable)|Quản lý duyệt phiếu lương.|
|`locked_by`|uuid|FK -> `users.id` (Nullable)|Người bấm chốt chi trả phiếu lương.|
|`created_at`|timestamp|Not Null|Ngày tạo phiếu lương.|
|`updated_at`|timestamp|Not Null|Lần cuối sửa đổi phiếu lương.|

### 6\.3. Bảng `payroll_line_items` (Chi Tiết Các Khoản Lương)

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã khoản chi tiết lương.|
|`payroll_record_id`|uuid|FK -> `payroll_records.id`|Thuộc phiếu lương tổng nào.|
|`item_type`|enum|Not Null|Loại khoản: `base_salary` (Lương cơ bản), `allowance` (Phụ cấp ăn trưa/xăng xe), `bonus` (Thưởng), `penalty` (Phạt), `tip` (Tiền bo), `commission` (Hoa hồng), `unused_leave_payout` (Tiền thanh toán phép tồn).|
|`amount`|decimal|Not Null|Số tiền của khoản này (Số dương là cộng thêm, số âm là trừ đi).|
|`note`|varchar|Not Null|Ghi chú diễn giải (VD: "Phụ cấp trách nhiệm tháng 7").|

### 6\.4. Bảng `payroll_disputes` (Khiếu Nại Bảng Lương)

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã đơn khiếu nại.|
|`payroll_record_id`|uuid|FK -> `payroll_records.id`|Khiếu nại trên phiếu lương nào.|
|`raised_by`|uuid|FK -> `users.id`|Nhân viên/Tài khoản tạo khiếu nại.|
|`reason`|varchar|Not Null|Nội dung khiếu nại (VD: "Tháng này bị tính thiếu 2 giờ OT ngày 15/7").|
|`status`|enum|Not Null|Trạng thái giải quyết: `open` (đang mở), `resolved` (đã xử lý xong), `rejected` (từ chối đơn).|
|`resolved_by`|uuid|FK -> `users.id` (Nullable)|Quản lý/Kế toán đứng ra xử lý khiếu nại.|
|`created_at`|timestamp|Not Null|Ngày gửi khiếu nại.|
|`resolved_at`|timestamp|Nullable|Ngày giải quyết xong.|

### 6\.5. Bảng `payroll_adjustments` (Nhật Ký Điều Chỉnh Lương Thủ Công)

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã log điều chỉnh.|
|`payroll_record_id`|uuid|FK -> `payroll_records.id`|Phiếu lương bị điều chỉnh.|
|`adjusted_by`|uuid|FK -> `users.id`|Kế toán/Quản lý thực hiện sửa lương.|
|`reason`|varchar|Not Null|Lý do bắt buộc phải ghi khi điều chỉnh lương thủ công.|
|`before_snapshot`|json|Not Null|Snapshot toàn bộ dữ liệu phiếu lương trước khi sửa (JSON).|
|`after_snapshot`|json|Not Null|Snapshot dữ liệu phiếu lương sau khi sửa xong (JSON).|
|`created_at`|timestamp|Not Null|Thời điểm thực hiện điều chỉnh.|

## 7\. Phân hệ Hệ thống, Thông báo & Kiểm toán (System)
### 7\.1. Bảng `export_jobs` (Hàng Đợi Xuất Báo Cáo File)

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã tiến trình xuất file.|
|`tenant_id`|uuid|FK -> `tenants.id`|Định danh Tenant.|
|`requested_by`|uuid|FK -> `users.id`|Người dùng bấm yêu cầu tải báo cáo.|
|`export_type`|enum|Not Null|Loại báo cáo: `payroll` (Báo cáo Lương), `attendance` (Báo cáo Chấm công).|
|`filters`|json|Not Null|Điều kiện lọc dạng JSON (VD: `{"month": "2026-07", "department_id": "xxx"}`).|
|`status`|enum|Not Null|Trạng thái file: `pending` (chờ xử lý), `processing` (đang tạo file), `completed` (hoàn tất), `failed` (lỗi).|
|`file_url`|varchar|Nullable|Đường dẫn URL để tải file Excel/PDF sau khi xuất xong.|
|`created_at`|timestamp|Not Null|Ngày tạo yêu cầu.|
|`completed_at`|timestamp|Nullable|Ngày file tạo xong.|

### 7\.2. Bảng `notifications` (Thông Báo Hệ Thống)

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã thông báo.|
|`tenant_id`|uuid|FK -> `tenants.id`|Định danh Tenant.|
|`user_id`|uuid|FK -> `users.id`|Người nhận thông báo.|
|`type`|enum|Not Null|Loại thông báo (VD: `leave_submitted`, `leave_approved`, `payroll_locked`...).|
|`title`|varchar|Not Null|Tiêu đề thông báo hiển thị trên App/Web.|
|`body`|varchar|Not Null|Nội dung thông báo chi tiết.|
|`related_entity_id`|uuid|Nullable|ID của đối tượng liên quan (VD: ID của đơn phép để bấm click vào xem ngay).|
|`read_at`|timestamp|Nullable|Thời điểm người dùng bấm đọc thông báo (Null nếu chưa đọc).|
|`created_at`|timestamp|Not Null|Ngày thông báo được gửi đi.|

### 7\.3. Bảng `audit_logs` (Nhật Ký Kiểm Toán Hệ Thống)

|Tên Cột|Kiểu Dữ Liệu|Ràng Buộc|Ý Nghĩa & Nghiệp Vụ Chi Tiết|
| :- | :- | :- | :- |
|`id`|uuid|Primary Key|Mã log kiểm toán.|
|`tenant_id`|uuid|FK -> `tenants.id`|Định danh Tenant.|
|`actor_id`|uuid|FK -> `users.id`|Người thực hiện hành động làm thay đổi dữ liệu.|
|`action`|enum|Not Null|Hành động: `create` (Tạo mới), `update` (Cập nhật), `delete` (Xóa).|
|`target_table`|varchar|Not Null|Tên bảng bị tác động (VD: `employees`, `payroll_records`).|
|`target_id`|uuid|Not Null|ID của bản ghi bị tác động.|
|`old_values`|json|Nullable|Dữ liệu cũ trước khi sửa/xóa (JSON).|
|`new_values`|json|Nullable|Dữ liệu mới sau khi tạo/sửa (JSON).|
|`created_at`|timestamp|Not Null|Thời điểm xảy ra thao tác.|


