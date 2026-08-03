# Runbook: Phase 2 - Submission & Moderation (Realtime)

## 1. Mục đích
Tài liệu này cung cấp các kịch bản xử lý sự cố (troubleshooting) và vận hành cho hệ thống nộp lời chúc và kiểm duyệt trong Phase 2, đặc biệt tập trung vào Supabase Realtime và cơ chế chống spam (CAPTCHA/Rate-limit).

## 2. Các sự cố thường gặp & Cách xử lý

### 2.1. Lời chúc đã duyệt nhưng không hiện trên Public Wall
**Triệu chứng:** Owner đã nhấn "Phê duyệt" thành công trên Dashboard, nhưng ở màn hình người tham dự (Guest) lời chúc không tự động hiện lên dù không có lỗi báo trên giao diện.

**Nguyên nhân có thể:**
- Mất kết nối Supabase Realtime do mạng của client (WebSocket timeout).
- Trigger `trg_wishes_realtime_event` không hoạt động.
- Cấu hình Publication `supabase_realtime` bị mất bảng `realtime_wall_events`.

**Cách khắc phục:**
1. **Phía Client:**
   - Client đã được code để tự động có nút "Đang đồng bộ..." và tải lại dữ liệu (refetch) nếu bị mất kết nối (fallback to HTTP).
   - Yêu cầu người dùng f5 (reload) nếu trình duyệt bị ngủ đông (tab suspension) quá lâu gây freeze WebSocket.
2. **Phía Server (Database):**
   - Chạy query kiểm tra xem event có được sinh ra không:
     ```sql
     SELECT * FROM realtime_wall_events ORDER BY created_at DESC LIMIT 5;
     ```
   - Nếu không có event, kiểm tra trigger trên bảng `wishes`:
     ```sql
     SELECT event_object_table, trigger_name FROM information_schema.triggers WHERE event_object_table = 'wishes';
     ```
   - Nếu trigger có nhưng không bắn được về client, hãy vào [Supabase Dashboard -> Database -> Replication](https://supabase.com/dashboard/project/_/database/replication) và đảm bảo `realtime_wall_events` đã được bật Realtime.

### 2.2. Bị tấn công Spam Submit (Rate Limit quá tải)
**Triệu chứng:** Hàng loạt lời chúc spam xuất hiện ở trạng thái `pending`, làm tràn Moderation Queue.

**Nguyên nhân:** Có người cố tình bypass frontend hoặc CAPTCHA để gọi thẳng vào API.

**Cách khắc phục:**
1. **Kích hoạt khẩn cấp chế độ "Đóng sự kiện":**
   - Chạy lệnh SQL hoặc vào DB đổi `submission_mode = 'closed'` cho event bị tấn công.
   ```sql
   UPDATE public.events SET submission_mode = 'closed' WHERE id = '...';
   ```
2. **Xoá hàng loạt (Bulk Reject/Delete):**
   - Có thể dùng giao diện Moderation để chọn tất cả và Reject.
   - Nếu số lượng lên đến hàng ngàn, sử dụng SQL để dọn dẹp an toàn:
   ```sql
   UPDATE public.wishes 
   SET moderation_status = 'rejected', deleted_at = now() 
   WHERE event_id = '...' AND moderation_status = 'pending' AND created_at > '2026-08-01';
   ```

### 2.3. Lỗi xác thực CAPTCHA (Turnstile) diện rộng
**Triệu chứng:** Người dùng báo không thể nộp lời chúc, thông báo lỗi "CAPTCHA không hợp lệ".

**Nguyên nhân:** Cloudflare Turnstile đang có sự cố hoặc cấu hình domain bị sai.

**Cách khắc phục:**
- Kiểm tra lại biến môi trường `NEXT_PUBLIC_TURNSTILE_SITE_KEY` và `TURNSTILE_SECRET_KEY` trong Vercel.
- Nếu Cloudflare đang sập, có thể tạm thời vô hiệu hóa bằng cách xóa kiểm tra CAPTCHA trong `submit-wish` Server Action (chỉ làm khi khẩn cấp) hoặc đổi secret key sang mode testing của Turnstile (`1x00000000000000000000AA` / `2x0000000000000000000000000000000AA`).
