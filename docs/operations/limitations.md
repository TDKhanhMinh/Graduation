# Known Limitations

Tài liệu này ghi nhận các hạn chế về công nghệ, kiến trúc hoặc tính năng mà hệ thống Graduation Message v2 đang có. Các giới hạn này là do quyết định giữ chi phí ở mức MVP, và có thể sẽ được giải quyết trong Phase tương lai.

## 1. Trình duyệt & Thiết bị
- **Thu âm trên Safari (iOS):** Một số thiết bị iOS cũ hoặc khi người dùng không cấp quyền (Permission), API `MediaRecorder` có thể bị từ chối hoặc lỗi không rõ nguyên nhân.
- **Hỗ trợ định dạng âm thanh:** Audio được ghi dưới dạng webm/mp4 tuỳ trình duyệt, chưa có bước chuyển đổi đồng nhất thành `mp3` ở phía server do chi phí tài nguyên chuyển đổi cao. Safari có thể gặp vấn đề phát lại nếu file ghi từ Chrome không tương thích định dạng audio codec.

## 2. Serverless & Supabase Edge Functions
- **Giới hạn thời gian (Timeout):** Tối đa 10s cho các function miễn phí. Quá trình sinh Export Job, PDF Rendering không thể chạy trên Edge Function mà phải đẩy qua kiến trúc Worker Server.
- **Max Payload Size:** Việc truyền dữ liệu hình ảnh qua Base64 lớn hơn 5MB có thể bị ngắt. Đề xuất upload trực tiếp vào Storage bucket và truyền đường dẫn URL.

## 3. Worker In Ấn (PDF)
- **Độ trễ khi khởi động Puppeteer:** Việc render qua Headless Chrome mất khoảng 5-10s cho mỗi file.
- **RAM Bottleneck:** Nhu cầu bộ nhớ tăng đột biến nếu nhiều job cùng được xử lý đồng thời. Worker hiện sử dụng `SKIP LOCKED` với giới hạn xử lý 1-5 job/lượt, có thể tạo thành nút thắt cổ chai (bottleneck) nếu có >1000 người yêu cầu in cùng lúc.
- **CSS Print Media:** Các hiệu ứng ảnh động (animation, background gradients) trên Dashboard / Kỷ yếu không được render chính xác trên file PDF do giới hạn của Print Stylesheets.

## 4. Bảo mật & Chống Spam
- Chưa tích hợp hệ thống Captcha hoặc ReCaptcha. Người dùng ẩn danh có thể tự động spam nhiều lời chúc nếu biết Event ID (Rate Limiting hiện đang dựa vào Supabase RLS đơn giản bằng Session Id, nhưng không tuyệt đối).
- Cần có tài liệu hướng dẫn cụ thể về việc cấm (ban) IP từ Firewall của Vercel/Supabase nếu xảy ra tấn công DDoS.
