

**TÀI LIỆU YÊU CẦU PHẦN MỀM**

**(SOFTWARE REQUIREMENTS SPECIFICATION – SRS)**
# **1. Giới thiệu (Introduction)**
## **1.1. Mục đích tài liệu**
Tài liệu này đặc tả đầy đủ các yêu cầu chức năng (Functional Requirements) và phi chức năng (Non-Functional Requirements) của hệ thống Quản lý Nhân sự, Chấm công Sinh trắc học (Face ID) và Tính lương theo mô hình Đa khách thuê (Multi-Tenant SaaS). Tài liệu là cơ sở để đội ngũ phát triển, kiểm thử, và các bên liên quan (stakeholders) thống nhất phạm vi, hành vi mong đợi của hệ thống trước khi triển khai thiết kế kiến trúc (SAD), sơ đồ luồng nghiệp vụ (Sequence Diagram/Flowchart) và đặc tả API (OpenAPI).
## **1.2. Phạm vi hệ thống**
Hệ thống là một nền tảng SaaS đa khách thuê (multi-tenant), trong đó mỗi Tenant (khách hàng doanh nghiệp) có thể quản lý nhiều Chi nhánh (Branch), mỗi chi nhánh có nhiều Phòng ban (Department) và Nhân viên (Employee). Hệ thống bao phủ 7 phân hệ nghiệp vụ chính:

1. Quản trị & Cấu trúc Tổ chức: quản lý Tenant, cấu hình Tenant, Chi nhánh, Phòng ban, Ngày lễ.
1. Quản lý Nhân sự & Tài khoản: hồ sơ nhân viên, lịch sử lương/hợp đồng, tài khoản đăng nhập, phân quyền theo chi nhánh.
1. Sinh trắc học & Thiết bị Kiosk: đăng ký khuôn mặt, cam kết đồng ý sử dụng dữ liệu sinh trắc học, xác thực khuôn mặt tại Kiosk, nhật ký xóa dữ liệu sinh trắc học.
1. Phân ca & Chấm công: ca mẫu, lịch phân ca thực tế, sự kiện chấm công (vào/ra/nghỉ giữa giờ), mã dự phòng PIN/QR, bảng tổng hợp công theo ngày.
1. Quản lý Nghỉ phép: đơn xin nghỉ phép, quỹ phép của nhân viên theo năm.
1. Tính Lương: chính sách lương/phạt, phiếu lương, các khoản chi tiết lương, khiếu nại lương, điều chỉnh lương thủ công.
1. Hệ thống, Thông báo & Kiểm toán: hàng đợi xuất báo cáo, thông báo trong ứng dụng, nhật ký kiểm toán (audit log).

Phạm vi của phiên bản SRS này bao gồm đầy đủ cả 7 phân hệ nêu trên, tương ứng với toàn bộ mô hình dữ liệu (schema) đã được thiết kế.
## **1.3. Định nghĩa, Thuật ngữ & Từ viết tắt**

|**Thuật ngữ**|**Giải thích**|
| :- | :- |
|Tenant|Một tổ chức/doanh nghiệp khách hàng đăng ký sử dụng nền tảng (mô hình đa khách thuê).|
|Branch|Chi nhánh/văn phòng trực thuộc một Tenant, có múi giờ và tiền tệ riêng.|
|Kiosk|Thiết bị vật lý đặt tại chi nhánh dùng để nhân viên chấm công bằng khuôn mặt.|
|Face ID / Liveness|Công nghệ nhận diện khuôn mặt và phát hiện giả mạo (ảnh/video) khi xác thực.|
|Idempotency Key|Khóa duy nhất đảm bảo một sự kiện chỉ được xử lý một lần dù client gửi lặp lại.|
|OT (Overtime)|Giờ làm thêm ngoài ca chuẩn, được tính hệ số lương riêng.|
|RBAC|Role-Based Access Control – Kiểm soát truy cập theo vai trò.|
|SoD|Segregation of Duties – Nguyên tắc phân tách nhiệm vụ (VD: người tạo lương ≠ người duyệt lương).|
|PII / Biometric Data|Dữ liệu cá nhân/dữ liệu sinh trắc học nhạy cảm cần tuân thủ quy định bảo vệ dữ liệu.|
|Soft Delete|Xóa mềm – đánh dấu bản ghi đã xóa (deleted\_at) thay vì xóa vật lý khỏi CSDL.|
## **1.4. Tài liệu tham khảo**
- Từ điển Dữ liệu & Phân tích Nghiệp vụ Chi tiết Từng Cột (table\_business\_analysis.docx).
# **2. Mô tả Tổng quan (Overall Description)**
## **2.1. Bối cảnh sản phẩm**
Hệ thống vận hành theo mô hình SaaS đa khách thuê: dữ liệu của các Tenant được cô lập logic thông qua tenant\_id trên hầu hết các bảng nghiệp vụ. Người dùng cuối tương tác qua hai kênh chính: (1) Portal Web/App quản trị dành cho Owner/Manager/Accountant/Staff, và (2) Thiết bị Kiosk vật lý đặt tại chi nhánh dùng để chấm công bằng khuôn mặt hoặc mã dự phòng (QR/PIN).
## **2.2. Tác nhân & Vai trò người dùng (Actors)**

|**Vai trò**|**Mô tả & Quyền hạn chính**|
| :- | :- |
|Owner|Chủ doanh nghiệp/Tenant. Toàn quyền trên các chi nhánh được gán, bao gồm cấu hình, nhân sự, lương.|
|Manager|Quản lý chi nhánh. Duyệt ca, duyệt nghỉ phép, duyệt/xem báo cáo lương (tuỳ cấu hình), quản lý nhân viên trong chi nhánh.|
|Accountant|Kế toán. Khởi tạo, xử lý, điều chỉnh và chốt phiếu lương; xử lý khiếu nại lương.|
|Staff|Nhân viên. Xem lịch ca, xem công, gửi đơn xin nghỉ phép, xem phiếu lương của bản thân, xem thông báo.|
|System Admin|Quản trị hệ thống cấp nền tảng (ngoài phạm vi user\_branch\_roles theo tenant) – vận hành, hỗ trợ kỹ thuật.|
|Kiosk Device|Tác nhân phi người dùng: gửi sự kiện xác thực khuôn mặt và sự kiện chấm công về hệ thống.|
## **2.3. Giả định & Ràng buộc (Assumptions & Constraints)**
1. Một tài khoản (users) có thể không gắn với hồ sơ nhân viên nào (employee\_id null) — áp dụng cho tài khoản quản trị thuần tuý.
1. Một nhân viên (employees) tối đa có một tài khoản đăng nhập (users) tương ứng 1-1.
1. Mỗi Tenant có duy nhất một bản ghi cấu hình (tenant\_settings) theo quan hệ 1-1.
1. Việc xác thực khuôn mặt (face\_verification\_logs) có thể xảy ra mà không nhận diện được nhân viên (employee\_id null trong trường hợp người lạ hoặc no\_match).
1. Một sự kiện chấm công (attendance\_events) có thể không gắn với ca cụ thể nào (shift\_id null) nếu nhân viên chấm công ngoài lịch phân ca.
1. Hệ thống giả định thiết bị Kiosk có kết nối mạng không ổn định — do đó cơ chế idempotency\_key là bắt buộc cho các sự kiện chấm công và xác thực khuôn mặt.
1. Dữ liệu sinh trắc học (face\_embedding\_samples) được xem là dữ liệu nhạy cảm, chịu ràng buộc pháp lý về thu thập/lưu trữ/xoá (xem mục 4.6).
## **2.4. Đặc điểm người dùng**
Người dùng Portal (Owner/Manager/Accountant) được giả định có kiến thức nghiệp vụ quản trị nhân sự/kế toán cơ bản, thao tác trên trình duyệt web hoặc ứng dụng di động. Nhân viên (Staff) sử dụng ứng dụng di động ở mức cơ bản. Người vận hành Kiosk là nhân viên bảo trì kỹ thuật, không phải người dùng nghiệp vụ trực tiếp.
# **3. Yêu cầu Chức năng (Functional Requirements)**
Mỗi yêu cầu chức năng được gán mã định danh theo mẫu FR-<PHÂN HỆ>-<số thứ tự> để phục vụ truy vết (traceability) sang API Design Document và test case ở giai đoạn sau.
## **3.1. Phân hệ Quản trị & Cấu trúc Tổ chức (Organization)**
Phân hệ quản lý thông tin nền tảng cho mô hình đa khách thuê: Tenant, cấu hình Tenant, Chi nhánh, Phòng ban, Ngày lễ.

|**Mã YC**|**Tên yêu cầu**|**Mô tả chi tiết**|
| :- | :- | :- |
|FR-ORG-01|Đăng ký Tenant mới|Hệ thống cho phép khởi tạo một Tenant mới với tên tổ chức; tự động sinh id và created\_at.|
|FR-ORG-02|Cấu hình tham số Tenant|Cho phép Owner/System Admin thiết lập face\_match\_threshold (ngưỡng tin cậy khớp khuôn mặt, 0-1) và max\_face\_retries (số lần thử lại tối đa) cho mỗi Tenant.|
|FR-ORG-03|Quản lý Chi nhánh (CRUD)|Tạo/sửa/xoá mềm chi nhánh với tên, múi giờ (timezone), đơn vị tiền tệ (currency), ngày nghỉ cố định trong tuần (weekly\_off\_days dạng JSON).|
|FR-ORG-04|Quản lý Phòng ban (CRUD)|Tạo/sửa/xoá phòng ban trực thuộc một chi nhánh, gồm tên và mã phòng ban (code) duy nhất trong phạm vi chi nhánh.|
|FR-ORG-05|Quản lý Ngày lễ|Cho phép khai báo ngày lễ ở cấp hệ thống (tenant\_id null), cấp Tenant hoặc cấp Chi nhánh cụ thể, với khoảng ngày bắt đầu/kết thúc.|
|FR-ORG-06|Phân giải ưu tiên Ngày lễ|Khi tính công/lương, hệ thống áp dụng ngày lễ theo thứ tự ưu tiên: Chi nhánh > Tenant > Hệ thống (nếu trùng ngày).|
|FR-ORG-07|Xoá mềm Chi nhánh|Chi nhánh bị vô hiệu hoá (deleted\_at) không còn xuất hiện trong danh sách hoạt động nhưng vẫn giữ lịch sử dữ liệu liên quan.|
## **3.2. Phân hệ Quản lý Nhân sự & Tài khoản (Employees & Users)**
Phân hệ quản lý hồ sơ nhân viên, lịch sử lương/hợp đồng, tài khoản đăng nhập và phân quyền theo chi nhánh.

|**Mã YC**|**Tên yêu cầu**|**Mô tả chi tiết**|
| :- | :- | :- |
|FR-EMP-01|Tạo hồ sơ nhân viên|Khởi tạo nhân viên với employee\_code duy nhất trong phạm vi Tenant, họ tên, chi nhánh, phòng ban (tuỳ chọn), trạng thái mặc định probation hoặc active.|
|FR-EMP-02|Cập nhật trạng thái nhân sự|Cho phép chuyển trạng thái nhân viên: active ⇄ probation ⇄ suspended → terminated. Khi chuyển sang terminated, bắt buộc nhập termination\_date.|
|FR-EMP-03|Xoá mềm hồ sơ nhân viên|Nhân viên bị xoá mềm (deleted\_at) không còn đăng nhập/chấm công được nhưng dữ liệu lịch sử được giữ lại phục vụ báo cáo/kiểm toán.|
|FR-EMP-04|Quản lý lịch sử lương/hợp đồng|Ghi nhận các mức lương (rate) theo loại hợp đồng (full\_time/part\_time/internship) và đơn vị tính lương pay\_basis (hourly/daily/shift/monthly) với khoảng hiệu lực effective\_from–effective\_to; bản ghi hiện hành có effective\_to = null.|
|FR-EMP-05|Tự động đóng hiệu lực mức lương cũ|Khi thêm một bản ghi lương mới cho nhân viên, hệ thống tự động gán effective\_to cho bản ghi đang hiệu lực trước đó = effective\_from - 1 ngày.|
|FR-EMP-06|Tạo tài khoản đăng nhập|Tạo tài khoản (users) với email duy nhất trong hệ thống, mật khẩu được băm (Argon2/Bcrypt); có thể liên kết 1-1 với một nhân viên hoặc để trống (tài khoản quản trị).|
|FR-EMP-07|Vô hiệu hoá tài khoản|Xoá mềm tài khoản (deleted\_at) khi nhân viên nghỉ việc hoặc theo yêu cầu quản trị; tài khoản bị vô hiệu không thể đăng nhập.|
|FR-EMP-08|Phân quyền theo Chi nhánh|Gán vai trò (owner/manager/accountant/staff) cho một tài khoản tại một chi nhánh cụ thể, hoặc trên toàn bộ chi nhánh (branch\_id null) nếu là quyền cấp Tenant.|
|FR-EMP-09|Ràng buộc duy nhất vai trò|Một tài khoản chỉ có tối đa một vai trò cho mỗi (chi nhánh, role) — tránh gán trùng lặp.|
|FR-EMP-10|Tìm kiếm & lọc nhân viên|Cho phép tìm kiếm nhân viên theo mã, tên, trạng thái, chi nhánh, phòng ban.|
## **3.3. Phân hệ Sinh trắc học & Thiết bị Kiosk (Biometrics)**
Phân hệ quản lý toàn bộ vòng đời dữ liệu sinh trắc học khuôn mặt: từ thu thập cam kết đồng ý, đăng ký mẫu khuôn mặt, xác thực tại Kiosk, cho đến xoá dữ liệu.

|**Mã YC**|**Tên yêu cầu**|**Mô tả chi tiết**|
| :- | :- | :- |
|FR-BIO-01|Thu thập Cam kết Đồng ý|Trước khi đăng ký khuôn mặt, hệ thống bắt buộc ghi nhận biometric\_consents với consented\_at; không cho phép đăng ký mẫu khuôn mặt nếu chưa có cam kết hợp lệ (chưa bị revoked\_at).|
|FR-BIO-02|Thu hồi Cam kết|Nhân viên/Quản lý có thể thu hồi cam kết (revoked\_at); khi thu hồi, hệ thống phải vô hiệu hoá toàn bộ mẫu khuôn mặt liên quan và kích hoạt quy trình xoá dữ liệu (FR-BIO-05).|
|FR-BIO-03|Đăng ký mẫu khuôn mặt|Cho phép chụp và lưu nhiều mẫu vector khuôn mặt (descriptor) theo các góc chụp khác nhau (angle\_label: front/left\_45/right\_45) cùng model\_version của AI.|
|FR-BIO-04|Quản lý phiên bản Model AI|Khi nâng cấp model\_version, hệ thống cảnh báo các mẫu khuôn mặt cũ không tương thích và yêu cầu đăng ký lại.|
|FR-BIO-05|Xoá dữ liệu sinh trắc học & ghi log|Khi nhân viên nghỉ việc hoặc thu hồi cam kết, hệ thống xoá vật lý face\_embedding\_samples và ghi nhận vào biometric\_deletion\_logs với lý do (Employee Resigned/Consent Revoked...).|
|FR-BIO-06|Đăng ký & quản lý Kiosk|Tạo thiết bị Kiosk gắn với một chi nhánh, đặt tên thiết bị, theo dõi trạng thái active/inactive/flagged.|
|FR-BIO-07|Giám sát Heartbeat Kiosk|Kiosk định kỳ gửi tín hiệu ping cập nhật last\_seen\_at; hệ thống tự động cảnh báo/đổi trạng thái nếu Kiosk mất kết nối quá ngưỡng thời gian cấu hình.|
|FR-BIO-08|Xác thực khuôn mặt tại Kiosk|Kiosk gửi ảnh khuôn mặt kèm idempotency\_key; hệ thống so khớp với các mẫu đã đăng ký theo face\_match\_threshold của Tenant, trả kết quả matched/no\_match/liveness\_failed cùng confidence\_score.|
|FR-BIO-09|Chống giả mạo (Liveness Detection)|Hệ thống phải phát hiện và từ chối ảnh/video giả mạo (liveness\_failed) trước khi thực hiện so khớp khuôn mặt.|
|FR-BIO-10|Giới hạn số lần thử lại|Sau max\_face\_retries lần xác thực thất bại liên tiếp, Kiosk tự động chuyển hướng nhân viên sang phương án dự phòng (QR/PIN).|
|FR-BIO-11|Chống trùng lặp log xác thực|idempotency\_key trên face\_verification\_logs phải duy nhất toàn hệ thống để tránh ghi nhận trùng khi mạng gửi lặp.|
## **3.4. Phân hệ Phân ca & Chấm công (Shifts & Attendance)**
Phân hệ quản lý ca làm việc mẫu, lịch phân ca thực tế, ghi nhận sự kiện chấm công (kể cả qua Kiosk lẫn phương án dự phòng), và tổng hợp công theo ngày.

|**Mã YC**|**Tên yêu cầu**|**Mô tả chi tiết**|
| :- | :- | :- |
|FR-SHF-01|Quản lý Ca mẫu|Tạo ca mẫu (shift\_templates) với giờ bắt đầu/kết thúc, cờ is\_overnight (ca qua đêm), thời gian nghỉ giữa ca, số phút cho phép đi muộn/về sớm.|
|FR-SHF-02|Xếp lịch phân ca|Quản lý tạo lịch phân ca (shifts) cho nhân viên từ ca mẫu hoặc nhập tay (shift\_template\_id null), với trạng thái khởi tạo draft.|
|FR-SHF-03|Vòng đời trạng thái Ca|Ca chuyển trạng thái theo luồng: draft → published → confirmed/change\_requested → in\_progress → completed, hoặc cancelled ở bất kỳ bước nào trước in\_progress.|
|FR-SHF-04|Nhân viên xác nhận/yêu cầu đổi ca|Nhân viên có thể xác nhận ca đã published (ghi confirmed\_by) hoặc gửi yêu cầu đổi ca (change\_requested).|
|FR-SHF-05|Ghi nhận sự kiện chấm công|Ghi nhận attendance\_events với loại sự kiện (check\_in/check\_out/break\_start/break\_end/manager\_adjust) và phương thức (face\_id/qr\_fallback/pin\_fallback), có idempotency\_key chống trùng.|
|FR-SHF-06|Chấm công qua Kiosk khuôn mặt|Khi xác thực khuôn mặt thành công (FR-BIO-08 trả matched), hệ thống tự động tạo attendance\_event tương ứng và liên kết verification\_log\_id.|
|FR-SHF-07|Chấm công bằng phương án dự phòng|Khi Face ID thất bại quá số lần cho phép, nhân viên dùng mã QR hoặc mã PIN dự phòng (attendance\_fallback\_codes) còn hạn (expires\_at) và chưa dùng (used\_at null).|
|FR-SHF-08|Quản lý mã dự phòng|Sinh mã PIN/OTP có thời hạn cho nhân viên; đánh dấu used\_at ngay khi sử dụng để không tái sử dụng.|
|FR-SHF-09|Ghi nhận vị trí chấm công|Lưu toạ độ GPS (location JSON) khi có, phục vụ đối soát chấm công ngoài văn phòng (nếu Tenant bật tính năng).|
|FR-SHF-10|Điều chỉnh công thủ công|Quản lý có thể tạo sự kiện manager\_adjust để sửa/bổ sung công cho nhân viên (VD: quên chấm công), yêu cầu ghi log kiểm toán.|
|FR-SHF-11|Tự động tổng hợp công theo ngày|Hệ thống chạy job định kỳ tính actual\_work\_hours, late\_minutes, early\_leave\_minutes, overtime\_hours và status (present/absent/late/leave/holiday/off) cho từng (nhân viên, ngày, ca), ghi rebuilt\_at.|
|FR-SHF-12|Tính lại khi có thay đổi|Khi có sự kiện chấm công mới hoặc đơn nghỉ phép được duyệt tác động đến ngày đã tổng hợp, hệ thống phải tính lại (rebuild) bản ghi daily\_attendance\_summaries tương ứng.|
|FR-SHF-13|Áp dụng Ngày lễ/Ngày nghỉ tuần|Khi tổng hợp công, hệ thống đối chiếu holidays và weekly\_off\_days của chi nhánh để gán trạng thái holiday/off phù hợp thay vì absent.|
## **3.5. Phân hệ Quản lý Nghỉ phép (Leave Management)**
Phân hệ quản lý đơn xin nghỉ phép và quỹ phép hằng năm của từng nhân viên.

|**Mã YC**|**Tên yêu cầu**|**Mô tả chi tiết**|
| :- | :- | :- |
|FR-LEA-01|Tạo đơn xin nghỉ phép|Nhân viên tạo đơn với loại phép (annual/sick/maternity/unpaid/other), khoảng ngày nghỉ, số ngày (duration\_days, hỗ trợ 0.5 ngày), lý do; trạng thái khởi tạo draft hoặc pending.|
|FR-LEA-02|Duyệt/Từ chối đơn nghỉ phép|Manager duyệt (approved) hoặc từ chối (rejected) đơn, ghi nhận approved\_by; đơn đã locked không thể chỉnh sửa (đã tính vào kỳ lương).|
|FR-LEA-03|Kiểm tra quỹ phép trước khi duyệt|Hệ thống kiểm tra remaining\_days của employee\_leave\_balances trước khi cho phép duyệt đơn phép có lương (is\_paid = true) loại annual.|
|FR-LEA-04|Cập nhật quỹ phép theo trạng thái đơn|Khi đơn chuyển pending → tăng pending\_days; khi approved → giảm pending\_days, tăng used\_days; khi rejected/huỷ → hoàn lại pending\_days.|
|FR-LEA-05|Tính remaining\_days tự động|remaining\_days = total\_accrued − used\_days − pending\_days, được hệ thống tự tính lại mỗi khi có thay đổi.|
|FR-LEA-06|Khởi tạo quỹ phép đầu năm|Đầu mỗi năm dương lịch, hệ thống tự động khởi tạo bản ghi employee\_leave\_balances mới cho từng nhân viên đang active với total\_accrued theo chính sách Tenant.|
|FR-LEA-07|Đồng bộ với Chấm công|Đơn nghỉ phép approved trong khoảng ngày tương ứng phải được phản ánh vào daily\_attendance\_summaries (status = leave) khi tổng hợp công.|
|FR-LEA-08|Ngăn chồng lấn đơn nghỉ|Hệ thống cảnh báo/ngăn tạo đơn nghỉ phép trùng khoảng ngày với đơn khác đã pending/approved của cùng nhân viên.|
## **3.6. Phân hệ Tính Lương (Payroll Management)**
Phân hệ tính toán, duyệt, chốt và xử lý khiếu nại lương, dựa trên dữ liệu chấm công đã tổng hợp, chính sách lương/phạt, và các khoản thu nhập/khấu trừ.

|**Mã YC**|**Tên yêu cầu**|**Mô tả chi tiết**|
| :- | :- | :- |
|FR-PAY-01|Quản lý Chính sách Lương/Phạt|Khai báo payroll\_policies theo type (VD: ot\_multiplier\_weekday, late\_penalty\_per\_minute) với rate và khoảng hiệu lực effective\_from/effective\_to theo Tenant.|
|FR-PAY-02|Khởi tạo phiếu lương theo kỳ|Kế toán kích hoạt chạy bảng lương (payroll\_records) cho một kỳ (period, VD 2026-07), hệ thống tự tổng hợp gross\_amount từ daily\_attendance\_summaries, employee\_compensation\_history, payroll\_policies.|
|FR-PAY-03|Sinh chi tiết khoản lương|Hệ thống tự sinh các payroll\_line\_items: base\_salary, allowance, bonus, penalty, tip, commission, unused\_leave\_payout, mỗi khoản có amount (dương/âm) và note diễn giải.|
|FR-PAY-04|Tính khấu trừ Bảo hiểm & Thuế|Tính social\_insurance\_amount và tax\_amount theo quy định hiện hành, cộng vào total\_deductions.|
|FR-PAY-05|Tính lương thực nhận|net\_amount = gross\_amount − total\_deductions, hiển thị theo currency của chi nhánh.|
|FR-PAY-06|Vòng đời trạng thái Phiếu lương|draft → pending\_review (created\_by) → reviewed (reviewed\_by) → locked (locked\_by); không cho sửa trực tiếp khi đã locked.|
|FR-PAY-07|Tách biệt vai trò tạo/duyệt/chốt|created\_by, reviewed\_by, locked\_by phải là 3 hành động ghi nhận độc lập (Segregation of Duties) — hệ thống nên cảnh báo/ràng buộc không cho cùng một tài khoản vừa tạo vừa chốt nếu chính sách Tenant yêu cầu.|
|FR-PAY-08|Khiếu nại phiếu lương|Nhân viên/Manager tạo payroll\_disputes với reason; trạng thái open → resolved/rejected, ghi resolved\_by và resolved\_at.|
|FR-PAY-09|Điều chỉnh lương thủ công có snapshot|Mọi điều chỉnh thủ công (payroll\_adjustments) bắt buộc có reason, lưu before\_snapshot và after\_snapshot (JSON) để phục vụ đối soát/kiểm toán.|
|FR-PAY-10|Ngăn sửa phiếu lương đã khoá|Phiếu lương ở trạng thái locked chỉ có thể thay đổi thông qua quy trình payroll\_adjustments có kiểm soát, không cho sửa trực tiếp line items.|
|FR-PAY-11|Xuất báo cáo lương|Cho phép xuất phiếu lương/bảng lương tổng hợp theo kỳ, chi nhánh, phòng ban (liên kết phân hệ Export – FR-SYS).|
## **3.7. Phân hệ Hệ thống, Thông báo & Kiểm toán (System)**
Phân hệ hỗ trợ vận hành: xuất báo cáo bất đồng bộ, thông báo trong ứng dụng, và ghi nhật ký kiểm toán cho mọi thay đổi dữ liệu nhạy cảm.

|**Mã YC**|**Tên yêu cầu**|**Mô tả chi tiết**|
| :- | :- | :- |
|FR-SYS-01|Yêu cầu xuất báo cáo|Người dùng tạo export\_jobs với export\_type (payroll/attendance) và filters (JSON, VD tháng/phòng ban); trạng thái khởi tạo pending.|
|FR-SYS-02|Xử lý bất đồng bộ tác vụ xuất|Hệ thống xử lý job nền: pending → processing → completed (kèm file\_url) hoặc failed; ghi completed\_at.|
|FR-SYS-03|Thông báo hoàn tất xuất file|Khi export\_jobs hoàn tất, hệ thống gửi notification loại export\_completed cho requested\_by.|
|FR-SYS-04|Gửi thông báo nghiệp vụ tự động|Hệ thống tự động sinh notifications tương ứng các sự kiện: leave\_submitted, leave\_approved, leave\_rejected, shift\_published, shift\_change\_requested, payroll\_pending\_review, payroll\_reviewed, payroll\_locked.|
|FR-SYS-05|Đánh dấu đã đọc thông báo|Người dùng đánh dấu read\_at khi xem thông báo; danh sách thông báo hỗ trợ lọc chưa đọc.|
|FR-SYS-06|Liên kết thông báo với đối tượng|related\_entity\_id cho phép điều hướng trực tiếp đến đối tượng liên quan (VD đơn phép, phiếu lương) khi người dùng bấm vào thông báo.|
|FR-SYS-07|Ghi nhật ký kiểm toán tự động|Mọi thao tác create/update/delete trên các bảng nghiệp vụ nhạy cảm (employees, payroll\_records, leave\_requests, user\_branch\_roles...) phải tự động sinh audit\_logs với actor\_id, target\_table, target\_id, old\_values, new\_values.|
|FR-SYS-08|Tra cứu lịch sử kiểm toán|Cho phép tra cứu audit\_logs theo tenant, bảng đối tượng, và ID bản ghi cụ thể, phục vụ điều tra sự cố/khiếu nại.|
|FR-SYS-09|Bất biến của Audit Log|Bản ghi audit\_logs không được phép sửa/xoá sau khi đã ghi nhận (append-only).|
# **4. Yêu cầu Phi chức năng (Non-Functional Requirements)**
## **4.1. Đa khách thuê & Cô lập Dữ liệu (Multi-Tenancy Isolation)**

|**Mã**|**Yêu cầu**|
| :- | :- |
|NFR-MT-01|Mọi truy vấn dữ liệu nghiệp vụ phải được lọc theo tenant\_id ở tầng ứng dụng hoặc tầng CSDL (Row-Level Security); không cho phép truy cập chéo Tenant trong bất kỳ trường hợp nào.|
|NFR-MT-02|Người dùng chỉ thao tác được trên các Chi nhánh mà họ được gán vai trò (user\_branch\_roles), trừ vai trò có branch\_id null (áp dụng toàn Tenant).|
|NFR-MT-03|Thông báo lỗi không được để lộ thông tin tồn tại/không tồn tại của dữ liệu thuộc Tenant khác (tránh dò quét).|
## **4.2. Hiệu năng (Performance)**
1. Thao tác xác thực khuôn mặt tại Kiosk (FR-BIO-08) phải phản hồi trong ≤ 2 giây ở điều kiện mạng bình thường.
1. Ghi nhận sự kiện chấm công (FR-SHF-05) phải hoàn tất trong ≤ 1 giây kể từ khi Kiosk gửi yêu cầu.
1. Job tổng hợp công hằng ngày (FR-SHF-11) phải xử lý xong toàn bộ nhân viên của một chi nhánh trong cửa sổ bảo trì đêm (VD trước 03:00 giờ địa phương của chi nhánh).
1. Truy vấn danh sách/báo cáo (nhân viên, chấm công, lương) phải hỗ trợ phân trang và trả kết quả trong ≤ 3 giây với tập dữ liệu tới 50.000 bản ghi mỗi Tenant.
## **4.3. Khả năng mở rộng & Sẵn sàng (Scalability & Availability)**
1. Kiến trúc phải hỗ trợ mở rộng ngang (horizontal scaling) khi số lượng Tenant/Chi nhánh/Kiosk tăng.
1. Mục tiêu SLA khả dụng của dịch vụ chấm công (Kiosk-facing API) tối thiểu 99.9% trong giờ hành chính.
1. Kiosk phải hỗ trợ chế độ lưu tạm cục bộ (offline queue) khi mất kết nối, đồng bộ lại bằng idempotency\_key khi có mạng.
## **4.4. Bảo mật (Security)**
1. Mật khẩu người dùng phải được băm bằng thuật toán mạnh (Argon2/Bcrypt), không lưu plaintext (đã phản ánh trong password\_hash).
1. Toàn bộ API phải yêu cầu xác thực (token/JWT) và áp dụng kiểm soát truy cập theo vai trò (RBAC) dựa trên user\_branch\_roles.
1. Dữ liệu truyền giữa Kiosk và máy chủ phải mã hoá qua TLS.
1. Các trường nhạy cảm (payload chấm công, snapshot lương) phải được kiểm soát quyền xem theo vai trò, không hiển thị cho Staff dữ liệu của nhân viên khác.
## **4.5. Toàn vẹn & Nhất quán Dữ liệu**
1. Các trường idempotency\_key (face\_verification\_logs, attendance\_events) phải là duy nhất toàn hệ thống và được kiểm tra ở tầng CSDL (unique constraint).
1. Các ràng buộc duy nhất tổng hợp bắt buộc: (tenant\_id, employee\_code), (employee\_id, date, shift\_id) của daily\_attendance\_summaries, (employee\_id, year) của employee\_leave\_balances, (employee\_id, period) của payroll\_records, (user\_id, branch\_id, role) của user\_branch\_roles.
1. Thao tác cập nhật trạng thái phải tuân theo máy trạng thái (state machine) hợp lệ đã định nghĩa cho từng entity (ca, đơn phép, phiếu lương, khiếu nại, xuất báo cáo, kiosk...); không cho phép chuyển trạng thái tuỳ ý.
## **4.6. Bảo mật & Tuân thủ Dữ liệu Sinh trắc học (Biometric Compliance)**
1. Không được thu thập/lưu trữ mẫu khuôn mặt (face\_embedding\_samples) nếu chưa có bản ghi biometric\_consents hợp lệ và chưa bị thu hồi.
1. Khi cam kết bị thu hồi hoặc nhân viên nghỉ việc, dữ liệu sinh trắc học phải được xoá vật lý trong thời gian tối đa theo chính sách Tenant (khuyến nghị ≤ 30 ngày) và ghi log xoá (biometric\_deletion\_logs).
1. Vector đặc trưng khuôn mặt (descriptor) phải được mã hoá khi lưu trữ (encryption at rest) và không được xuất ra ngoài qua API báo cáo thông thường.
1. Chỉ vai trò được uỷ quyền (Owner/System Admin) mới được xem báo cáo tổng hợp liên quan đến dữ liệu sinh trắc học; log truy cập phải được audit.
## **4.7. Khả năng bảo trì & Vận hành (Maintainability & Observability)**
1. Mọi job nền (tổng hợp công, tính lương, xuất báo cáo) phải có cơ chế retry và ghi log lỗi chi tiết.
1. Hệ thống phải cung cấp cơ chế giám sát trạng thái Kiosk (last\_seen\_at) và cảnh báo khi Kiosk offline quá ngưỡng.
## **4.8. Đa ngôn ngữ, Múi giờ & Tiền tệ (Localization)**
1. Toàn bộ thời gian nghiệp vụ (chấm công, ca làm việc) phải được tính theo timezone của Chi nhánh, không phải timezone máy chủ.
1. Số tiền lương phải hiển thị theo currency cấu hình của Chi nhánh/phiếu lương.
1. Giao diện Portal cần hỗ trợ tối thiểu song ngữ Việt–Anh.
# **5. Quy tắc Nghiệp vụ Tổng hợp (Cross-Cutting Business Rules)**
Danh sách dưới đây tổng hợp các quy tắc nghiệp vụ xuyên suốt nhiều phân hệ, dùng làm nguồn tham chiếu chung khi thiết kế logic dịch vụ (service layer) ở giai đoạn SAD.
## **5.1. Quy tắc trạng thái (State Machines)**

|**Đối tượng**|**Luồng trạng thái hợp lệ**|
| :- | :- |
|Ca làm việc (shifts)|draft → published → (confirmed | change\_requested) → in\_progress → completed; cancelled có thể xảy ra trước in\_progress.|
|Đơn nghỉ phép (leave\_requests)|draft → pending → (approved | rejected); approved → locked (khi đã tính vào kỳ lương).|
|Phiếu lương (payroll\_records)|draft → pending\_review → reviewed → locked.|
|Khiếu nại lương (payroll\_disputes)|open → (resolved | rejected).|
|Kiosk (kiosks)|active ⇄ inactive; active → flagged khi phát hiện bất thường (nhiều liveness\_failed liên tiếp).|
|Xuất báo cáo (export\_jobs)|pending → processing → (completed | failed).|
## **5.2. Quy tắc phụ thuộc dữ liệu theo thứ tự (Data Dependency Order)**
1. Cam kết đồng ý (biometric\_consents) phải tồn tại và hợp lệ trước khi đăng ký mẫu khuôn mặt.
1. Ca làm việc/lịch phân ca nên tồn tại trước khi ghi nhận chấm công để hệ thống tự liên kết shift\_id, tuy nhiên vẫn cho phép chấm công không có ca (shift\_id null).
1. daily\_attendance\_summaries phải được tính toán/rebuilt trước khi khởi tạo payroll\_records cho cùng kỳ.
1. employee\_leave\_balances của năm tương ứng phải tồn tại trước khi duyệt đơn nghỉ phép loại annual có lương.
## **5.3. Quy tắc Idempotency & Chống trùng**
- face\_verification\_logs.idempotency\_key: duy nhất toàn hệ thống.
- attendance\_events.idempotency\_key: duy nhất toàn hệ thống.
- Client (Kiosk/App) phải gửi lại cùng idempotency\_key khi retry một yêu cầu thất bại/timeout, để server trả về kết quả đã xử lý thay vì tạo bản ghi mới.
## **5.4. Quy tắc Audit bắt buộc**
Các hành động sau bắt buộc phải sinh audit\_logs: thay đổi trạng thái nhân sự, mọi thao tác trên payroll\_records/payroll\_line\_items/payroll\_adjustments, duyệt/từ chối đơn nghỉ phép, thay đổi phân quyền user\_branch\_roles, xoá dữ liệu sinh trắc học.
# **6. Yêu cầu Giao diện Ngoài (External Interface Requirements)**
## **6.1. Giao diện Kiosk (Kiosk ↔ Server)**
1. Kiosk gửi khung hình/ảnh khuôn mặt kèm liveness signal và idempotency\_key đến API xác thực khuôn mặt.
1. Kiosk nhận kết quả xác thực (matched/no\_match/liveness\_failed) và tự động gọi API ghi nhận attendance\_event nếu matched.
1. Kiosk hỗ trợ nhập PIN/quét QR như phương án dự phòng khi Face ID thất bại.
1. Kiosk định kỳ gửi heartbeat cập nhật last\_seen\_at.
## **6.2. Giao diện Portal Web/App**
1. Portal cung cấp các màn hình quản trị theo từng phân hệ tương ứng vai trò đăng nhập (RBAC).
1. App di động dành cho Staff: xem lịch ca, xem công, gửi đơn nghỉ phép, xem phiếu lương, nhận thông báo đẩy (push notification).
## **6.3. Giao diện Xuất File Báo cáo**
1. Kết quả export\_jobs tạo ra file (Excel/PDF) được lưu trữ và cung cấp qua file\_url có thời hạn truy cập (signed URL).
## **6.4. Giao diện Thông báo**
1. Thông báo trong ứng dụng (in-app) là bắt buộc; kênh email/push là mở rộng tuỳ theo cấu hình Tenant.
# **7. Yêu cầu Dữ liệu Tổng quan (Data Requirements Overview)**
Chi tiết đầy đủ cấu trúc bảng, kiểu dữ liệu, ràng buộc và diễn giải nghiệp vụ từng cột được đặc tả trong tài liệu Từ điển Dữ liệu (Data Dictionary) đính kèm — table\_business\_analysis.docx — và sơ đồ schema UTT.txt. SRS này tham chiếu các bảng đó làm nguồn sự thật (single source of truth) cho mô hình dữ liệu; không lặp lại toàn bộ chi tiết cột tại đây.
## **7.1. Nhóm bảng theo phân hệ**

|**Phân hệ**|**Bảng dữ liệu chính**|
| :- | :- |
|Tổ chức|tenants, tenant\_settings, branches, departments, holidays|
|Nhân sự & Tài khoản|employees, employee\_compensation\_history, users, auth_sessions, user\_branch\_roles|
|Sinh trắc học & Kiosk|biometric\_consents, biometric\_deletion\_logs, face\_embedding\_samples, kiosks, face\_verification\_logs|
|Ca & Chấm công|shift\_templates, shifts, attendance\_events, attendance\_fallback\_codes, daily\_attendance\_summaries|
|Nghỉ phép|leave\_requests, employee\_leave\_balances|
|Lương|payroll\_policies, payroll\_records, payroll\_line\_items, payroll\_disputes, payroll\_adjustments|
|Hệ thống|export\_jobs, notifications, audit\_logs|
## **7.2. Lưu giữ & Vòng đời dữ liệu (Retention)**
1. Dữ liệu sinh trắc học: xoá theo FR-BIO-05/NFR 4.6.
1. Nhật ký kiểm toán (audit\_logs): lưu trữ dài hạn, không xoá (append-only), thời gian lưu tối thiểu theo quy định pháp lý áp dụng cho Tenant.
1. Dữ liệu chấm công/lương: lưu tối thiểu theo yêu cầu pháp lý lao động/thuế của khu vực Tenant hoạt động (khuyến nghị ≥ 5 năm).
# **Phụ lục A — Bảng liệt kê Enum Hệ thống**
Tổng hợp toàn bộ giá trị enum trong schema, dùng để đồng bộ giữa SRS, SAD và OpenAPI ở các giai đoạn sau.
## **A.1. Trạng thái Nhân sự & Ca**

|**Enum**|**Giá trị**|
| :- | :- |
|employee\_status|active, probation, suspended, terminated|
|pay\_basis|hourly, daily, shift, monthly|
|shift\_status|draft, published, confirmed, change\_requested, in\_progress, completed, cancelled|
|branch\_role|owner, manager, accountant, staff|
## **A.2. Chấm công & Sinh trắc học**

|**Enum**|**Giá trị**|
| :- | :- |
|attendance\_event\_type|check\_in, check\_out, break\_start, break\_end, manager\_adjust|
|attendance\_method|face\_id, qr\_fallback, pin\_fallback|
|attendance\_summary\_status|present, absent, late, leave, holiday, off|
|kiosk\_status|active, inactive, flagged|
|verification\_result|matched, no\_match, liveness\_failed|
## **A.3. Nghỉ phép & Lương**

|**Enum**|**Giá trị**|
| :- | :- |
|leave\_category|annual, sick, maternity, unpaid, other|
|leave\_status|draft, pending, approved, rejected, locked|
|payroll\_status|draft, pending\_review, reviewed, locked|
|payroll\_item\_type|base\_salary, allowance, bonus, penalty, tip, commission, unused\_leave\_payout|
|dispute\_status|open, resolved, rejected|
## **A.4. Hệ thống**

|**Enum**|**Giá trị**|
| :- | :- |
|export\_status|pending, processing, completed, failed|
|export\_type|payroll, attendance|
|notification\_type|leave\_submitted, leave\_approved, leave\_rejected, shift\_published, shift\_change\_requested, payroll\_pending\_review, payroll\_reviewed, payroll\_locked, export\_completed|
|audit\_action|create, update, delete|
# **Phụ lục B — Ma trận Quyền theo Vai trò (Actor–Permission Matrix)**
Ma trận tổng quan mức truy cập theo phân hệ; chi tiết quyền hạn cấp API/endpoint sẽ được đặc tả trong OpenAPI Design Document.

|**Phân hệ**|**Owner**|**Manager**|**Accountant**|**Staff**|
| :- | :- | :- | :- | :- |
|Cấu trúc Tổ chức|Toàn quyền|Xem|Xem|Xem (giới hạn)|
|Nhân sự & Tài khoản|Toàn quyền|Quản lý NV chi nhánh|Xem|Xem hồ sơ bản thân|
|Sinh trắc học & Kiosk|Toàn quyền|Quản lý Kiosk chi nhánh|Không truy cập|Cấp cam kết bản thân|
|Ca & Chấm công|Toàn quyền|Xếp/duyệt ca, điều chỉnh công|Xem|Xem ca, chấm công, xác nhận ca|
|Nghỉ phép|Toàn quyền|Duyệt đơn|Xem|Gửi đơn, xem quỹ phép bản thân|
|Lương|Duyệt/Xem tổng|Xem báo cáo (tuỳ cấu hình)|Toàn quyền vận hành|Xem phiếu lương bản thân|
|Hệ thống & Audit|Toàn quyền|Xem thông báo/audit chi nhánh|Xem audit liên quan lương|Chỉ nhận thông báo|
# **Phụ lục C — Ma trận Truy vết Yêu cầu (Traceability tổng quan)**
Bảng dưới đây liệt kê nhóm mã yêu cầu theo phân hệ để tiện đối chiếu khi triển khai SAD, Sequence Diagram/Flowchart và OpenAPI Spec ở các giai đoạn tiếp theo.

|**Phân hệ**|**Dải mã FR**|**Số lượng yêu cầu**|
| :- | :- | :- |
|Tổ chức|FR-ORG-01 → FR-ORG-07|7|
|Nhân sự & Tài khoản|FR-EMP-01 → FR-EMP-10|10|
|Sinh trắc học & Kiosk|FR-BIO-01 → FR-BIO-11|11|
|Ca & Chấm công|FR-SHF-01 → FR-SHF-13|13|
|Nghỉ phép|FR-LEA-01 → FR-LEA-08|8|
|Lương|FR-PAY-01 → FR-PAY-11|11|
|Hệ thống|FR-SYS-01 → FR-SYS-09|9|

