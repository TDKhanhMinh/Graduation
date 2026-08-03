# Staging Security Checklist

Trước khi đưa phiên bản mới lên Staging hoặc Production, cần thực hiện kiểm tra các hạng mục bảo mật sau đây.

## 1. Supabase & Database (RLS & Grants)
- [ ] Xác nhận không có policy RLS nào mở rộng quá quyền hạn (`public` select/insert không được phép tiếp cận dữ liệu nhạy cảm).
- [ ] Chạy `supabase db lint` không phát hiện lỗi nào.
- [ ] Storage Buckets (`event-media`, `yearbook-exports`) đã giới hạn chặt chẽ `allowed_mime_types`.
- [ ] Các RPC/Functions có tag `SECURITY DEFINER` không bị lạm dụng quyền.
- [ ] Quyền đọc/ghi của PublicRole và AuthenticatedRole phù hợp.

## 2. Secrets & Môi trường
- [ ] Không rò rỉ `SUPABASE_SERVICE_ROLE_KEY` trên client (không có prefix `NEXT_PUBLIC_`).
- [ ] Các biến môi trường nhạy cảm được cấu hình an toàn trên Vercel / CI.
- [ ] Tiến hành dùng tool tự động (vd. `gitleaks`) quét repository định kỳ.

## 3. Client & Frontend (Next.js)
- [ ] **Content Security Policy (CSP)** đã được cấu hình chặt chẽ trong `next.config.ts`.
- [ ] Không lạm dụng `dangerouslySetInnerHTML` với nội dung do user tải lên mà chưa qua sanitizer.
- [ ] Form submission được bảo vệ bởi RLS/Session hoặc Captcha/Rate Limit nếu có public form.
- [ ] Không có cookie nhạy cảm nào bị thiếu `HttpOnly`, `Secure`.

## 4. Dependencies
- [ ] Lệnh `npm audit` trả về 0 vulnerabilities mức High / Critical. Các lỗi mức độ thấp (Low/Moderate) cần được xem xét và update khi cần thiết.

## 5. Audit & Compliance
- [ ] Xoá tài khoản (Account Deletion) giữ nguyên contract về kiểm toán (nếu có yêu cầu).
- [ ] Phục hồi Point-In-Time qua Supabase PITR chạy thử thành công trên môi trường mô phỏng.
