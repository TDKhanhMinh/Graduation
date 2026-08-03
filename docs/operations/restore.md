# Database Backup & Restore Runbook

Hệ thống sử dụng Supabase, do đó việc sao lưu và phục hồi dữ liệu phụ thuộc chủ yếu vào các công cụ và tính năng của Supabase. Runbook này hướng dẫn cách kiểm tra retention và phục hồi dữ liệu khi có sự cố.

## 1. Cơ chế Retention và Backup

- **Point-in-Time Recovery (PITR)**: Supabase Pro plan (hoặc tương đương) tự động lưu trữ dữ liệu theo thời gian thực (WAL archiving).
- **Scheduled Backups**: Supabase có tính năng tự động dump dữ liệu hàng ngày.
- **Data Retention**:
  - Khi chủ sự kiện xoá tài khoản hoặc sự kiện (Account/Event Deletion), cơ sở dữ liệu sẽ đánh dấu xoá mềm (Soft Delete) qua trigger `deleted_at` hoặc xoá cứng tuỳ theo chính sách riêng. Tuy nhiên, nó không ghi đè lên các bản backup đã diễn ra.
  - Media storage cũng có thể được xoá đồng bộ (bằng trigger hoặc worker), nhưng cần xác nhận chính sách lưu trữ Storage trong Supabase.

## 2. Các Bước Diễn Tập Phục Hồi (Restore Drill)

Không bao giờ thực hiện Restore thẳng lên Production Database trừ khi đó là lựa chọn duy nhất và đã được ban giám đốc đồng ý. Quy trình chuẩn (Drill) nên diễn ra trên một nhánh hoặc project độc lập.

### Bước 1: Khởi tạo Project Cách Ly (Isolated Environment)
- Đăng nhập vào Supabase Dashboard.
- Tạo một Project mới (ví dụ: `Graduation-Restore-Test`).
- Nếu dùng Supabase CLI, đảm bảo bạn đang ở môi trường dev hoặc staging an toàn.

### Bước 2: Tải Xuống Bản Sao Lưu
- Trong Production Project, vào **Database** -> **Backups**.
- Chọn bản backup gần nhất (Logical backup - file `.sql`).
- Tải file backup về máy (chứa các định nghĩa Schema, Roles, Grants và Data).

### Bước 3: Áp Dụng Dữ Liệu
- Chạy lệnh restore thông qua công cụ `psql` hoặc Supabase CLI vào Project cách ly.
```bash
psql -h <isolated_db_host> -p 5432 -d postgres -U postgres -W -f backup.sql
```
*(Thay thế host bằng thông tin của isolated project)*

### Bước 4: Kiểm tra tính toàn vẹn (Verification)
- [ ] Xác minh số lượng bản ghi trong bảng `events` và `wishes` khớp với thời điểm backup.
- [ ] Kiểm tra các rules RLS bằng cách đăng nhập thử với một test user.
- [ ] Xác minh Storage bucket `event-media` không bị mất liên kết (hoặc cần restore cả Storage nếu được hỗ trợ từ Supabase).

## 3. Khắc phục sự cố khẩn cấp trên Production
Nếu thực sự cần phục hồi (Point-in-Time) ngay trên Production:
1. Đặt ứng dụng (Next.js) vào chế độ **Maintenance Mode** để ngừng write từ người dùng.
2. Vào **Database** -> **Backups** -> **PITR**.
3. Chọn mốc thời gian trước khi xảy ra lỗi.
4. Bấm **Restore**. Quá trình này có thể mất từ vài phút tới vài chục phút tuỳ lượng dữ liệu.
5. Kiểm tra ứng dụng, tắt Maintenance Mode.
