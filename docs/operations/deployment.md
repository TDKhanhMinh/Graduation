# Deployment Guide

Quy trình triển khai (Deployment) hệ thống Graduation Message v2 trên môi trường Production.

## 1. Môi Trường & Cơ Sở Hạ Tầng
Hệ thống sử dụng các nền tảng sau:
- **Next.js Frontend & API:** Triển khai trên **Vercel** (hoặc AWS Amplify / tự host bằng Docker/PM2).
- **Cơ sở dữ liệu (Database) & Auth & Storage:** Sử dụng **Supabase Pro/Enterprise plan**.
- **Worker chạy ngầm (PDF Export Worker):** Chạy trên một server Node.js độc lập (ví dụ: EC2, DigitalOcean Droplet, hoặc Railway) do đặc thù cần sử dụng Puppeteer.

## 2. Cấu hình biến môi trường
Môi trường Production (Vercel) yêu cầu cấu hình các biến sau:
```env
# URL của hệ thống Supabase Project
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
# Key dùng chung cho người dùng chưa đăng nhập (Anon Key)
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# Key quản trị để vượt quyền RLS trong các API đặc biệt
SUPABASE_SERVICE_ROLE_KEY=...
# URL của website sau khi deploy
NEXT_PUBLIC_APP_URL=https://graduation.yourdomain.com
```

Trên Worker Node, ta cũng cần cung cấp `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY`.

## 3. Quản lý Migrations (Supabase)
Trước khi release tính năng mới, cần chạy các file migration lên Production Database.
- Cài đặt Supabase CLI: `npm i -g supabase`
- Login vào Supabase CLI: `supabase login`
- Link với dự án Production: `supabase link --project-ref [YOUR_PROJECT_ID]`
- Áp dụng các thay đổi: `supabase db push`

*Lưu ý: Chỉ thực hiện push migration trên môi trường staging trước để đảm bảo dữ liệu không bị hỏng.*

## 4. Khởi động PDF Worker
Worker cần được chạy ngầm liên tục và cấu hình tự khởi động lại (restart) khi crash.
- Cài đặt PM2: `npm install -g pm2`
- Di chuyển tới thư mục worker: `cd workers/pdf`
- Cài đặt thư viện: `npm install`
- Chạy bằng PM2: `pm2 start index.ts --name pdf-worker --interpreter ../../node_modules/.bin/tsx`
- Lưu cấu hình PM2: `pm2 save`

## 5. Danh Sách Kiểm Tra Khi Release
1. [ ] Các biến môi trường đã được cài đặt đủ trên Vercel.
2. [ ] Database migration đã thành công, các table và Storage bucket có đủ quyền RLS.
3. [ ] Chạy `npm run build` không có cảnh báo nghiêm trọng.
4. [ ] Worker báo log kết nối thành công và đang "Polling...".
5. [ ] Tạo một sự kiện ảo và test đăng 1 lời chúc.
