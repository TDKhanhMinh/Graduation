# Graduation Message
## Technical & Architectural Blueprint — Version 2.0

**Trạng thái tài liệu:** Đề xuất kiến trúc hoàn chỉnh cho MVP và định hướng mở rộng  
**Kiến trúc chính:** Next.js App Router + Supabase  
**Phạm vi:** Trang sự kiện công khai, gửi lời chúc, kiểm duyệt, đa phương tiện, AI gợi ý, reaction và xuất kỷ yếu PDF

---

## 1. Mục tiêu hệ thống

Graduation Message là nền tảng cho phép người dùng tạo một trang sự kiện và nhận lời chúc từ bạn bè thông qua đường dẫn hoặc mã QR. Hệ thống cần ưu tiên:

1. Trải nghiệm gửi lời chúc nhanh, đặc biệt trên thiết bị di động.
2. Trang sự kiện có khả năng chia sẻ tốt, tải nhanh và hỗ trợ SEO/Open Graph.
3. Chủ sự kiện có toàn quyền kiểm duyệt nội dung.
4. Hỗ trợ lời chúc dạng văn bản, ảnh và ghi âm.
5. Hạn chế spam, nội dung xấu và lạm dụng tài nguyên.
6. Có thể triển khai MVP với chi phí thấp nhưng không khóa đường mở rộng.

### 1.1. Phạm vi MVP

- Đăng ký, đăng nhập và quản lý tài khoản chủ sự kiện.
- Tạo, chỉnh sửa, lưu trữ và đóng sự kiện.
- Trang sự kiện công khai hoặc không công bố rộng rãi qua slug.
- Gửi lời chúc dạng văn bản, một ảnh hoặc một đoạn ghi âm.
- Chế độ tự động hiển thị hoặc yêu cầu kiểm duyệt.
- Realtime cho lời chúc đã được duyệt.
- Dashboard kiểm duyệt và thao tác hàng loạt.
- Reaction cơ bản.
- AI gợi ý lời chúc.
- Xuất bản in hoặc PDF cơ bản.

### 1.2. Ngoài phạm vi MVP

- Video dung lượng lớn.
- Bình luận lồng nhau.
- Chat trực tiếp.
- Thanh toán và gói thuê bao.
- Chỉnh sửa PDF theo kiểu trình thiết kế chuyên nghiệp.
- Phân quyền nhiều cộng tác viên trên cùng sự kiện.

Các tính năng này có thể triển khai ở giai đoạn sau mà không làm thay đổi kiến trúc cốt lõi.

---

## 2. Nguyên tắc kiến trúc

1. **Server-first:** Dữ liệu ban đầu của trang công khai được tải ở Server Component; chỉ phần cần tương tác mới là Client Component.
2. **Database-enforced authorization:** Quyền truy cập dữ liệu được bảo vệ bằng PostgreSQL RLS, không chỉ dựa vào giao diện hoặc middleware.
3. **Không tin dữ liệu từ client:** Trạng thái kiểm duyệt, đường dẫn file, quyền ghim và các trường hệ thống phải được xác lập ở server.
4. **Private-by-default cho media chưa duyệt:** File mới tải lên không được công khai trước khi vượt qua kiểm tra hoặc được duyệt.
5. **Idempotent submission:** Một yêu cầu gửi lại do mạng chậm không được tạo nhiều lời chúc trùng nhau.
6. **Progressive enhancement:** Nếu Realtime, AI hoặc ghi âm không hoạt động, người dùng vẫn gửi được lời chúc văn bản.
7. **MVP đơn giản, mở rộng có kiểm soát:** Dùng Postgres Changes ở quy mô nhỏ; chuyển sang Broadcast hoặc pipeline sự kiện khi lưu lượng tăng.

---

## 3. Kiến trúc tổng thể

```text
┌───────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS APP ROUTER                            │
│                                                                       │
│  Public Event Page      Wish Composer          Owner Dashboard        │
│  Server + Client        Client Component       Protected Routes       │
│  Components             + Server Endpoint      + Server Actions       │
│         │                       │                       │               │
└─────────┼───────────────────────┼───────────────────────┼───────────────┘
          │                       │                       │
          │ SSR/RSC Query         │ Submit/Upload         │ CRUD/Moderate
          ▼                       ▼                       ▼
┌───────────────────────────────────────────────────────────────────────┐
│                          SUPABASE PLATFORM                            │
│                                                                       │
│  Auth              PostgreSQL + RLS       Storage        Realtime     │
│  Owner accounts    events, wishes,        private/public Postgres     │
│  optional anon     media, reactions,      buckets        Changes or   │
│                    audit logs                            Broadcast     │
│                              │                                        │
│                              ▼                                        │
│                       Edge Functions                                  │
│               submit-wish / generate-ai-wish                          │
└───────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌───────────────────────────────────────────────────────────────────────┐
│                    THIRD-PARTY / SPECIALIZED SERVICES                 │
│ Turnstile or CAPTCHA   AI Provider   PDF Rendering Worker   Logging   │
└───────────────────────────────────────────────────────────────────────┘
```

### 3.1. Phân chia trách nhiệm

| Thành phần | Trách nhiệm |
|---|---|
| Next.js Server Components | Tải dữ liệu ban đầu, metadata, trang công khai, dashboard server-rendered |
| Next.js Client Components | Modal gửi lời chúc, ghi âm, upload progress, reaction, Realtime subscription |
| Supabase Auth | Xác thực chủ sự kiện; tùy chọn anonymous sign-in cho khách |
| PostgreSQL | Dữ liệu nghiệp vụ, ràng buộc, trigger, transaction và audit |
| RLS | Quyền đọc/ghi ở cấp hàng |
| Storage | Lưu media theo cấu trúc đường dẫn có kiểm soát |
| Edge Functions | Xác minh CAPTCHA, rate limit, chuẩn hóa dữ liệu, gọi AI |
| PDF Worker | Render trang in thành PDF ở runtime có trình duyệt headless |

---

## 4. Luồng dữ liệu chính

### 4.1. Tải trang sự kiện

1. Người dùng truy cập `/e/[slug]`.
2. Server Component truy vấn sự kiện theo slug.
3. Hệ thống kiểm tra trạng thái hiển thị, thời gian đóng và quyền truy cập.
4. Server tải trang đầu tiên của các lời chúc `approved`.
5. HTML và metadata được trả về cho trình duyệt.
6. Client Component khởi tạo Realtime subscription cho sự kiện.
7. Các lời chúc mới được hợp nhất theo `id`, tránh trùng dữ liệu giữa SSR và Realtime.

### 4.2. Gửi lời chúc

1. Khách mở Wish Composer.
2. Client kiểm tra dữ liệu cơ bản và tối ưu media.
3. Client yêu cầu một submission session hoặc signed upload URL.
4. Media được tải lên vùng private tạm thời.
5. Client gọi `submit-wish` kèm `client_request_id`, CAPTCHA token và storage path.
6. Server xác minh CAPTCHA, rate limit, trạng thái sự kiện, kiểu file và quyền sử dụng path.
7. Server xác định `pending` hoặc `approved`; client không được tự đặt trạng thái này.
8. Wish và media record được ghi trong một transaction logic.
9. Client nhận kết quả rõ ràng: đã hiển thị, đang chờ duyệt hoặc bị từ chối.

### 4.3. Kiểm duyệt

1. Owner mở danh sách `pending`.
2. Owner duyệt, từ chối, ẩn, ghim hoặc xóa mềm.
3. Database ghi `moderated_by`, `moderated_at` và audit log.
4. Khi chuyển sang `approved`, sự kiện Realtime được phát cho public wall.
5. Khi chuyển khỏi `approved`, client loại bỏ item tương ứng.

### 4.4. Xuất PDF

1. Owner yêu cầu tạo PDF.
2. Server tạo export job và chụp snapshot dữ liệu cần xuất.
3. PDF Worker render route bảo vệ `/e/[slug]/print?token=...`.
4. File PDF được lưu vào bucket private.
5. Owner nhận signed URL có thời hạn.

---

## 5. Mô hình dữ liệu đề xuất

### 5.1. Quy ước

- Lưu `storage_path`, không lưu URL tuyệt đối; URL có thể thay đổi theo bucket hoặc CDN.
- Dùng `CHECK CONSTRAINT` cho các trạng thái ổn định để tránh dữ liệu sai.
- Mọi bảng nghiệp vụ có `created_at`; bảng có chỉnh sửa cần `updated_at`.
- Xóa mềm với `deleted_at` cho dữ liệu cần audit hoặc khôi phục.
- Dùng `client_request_id` để chống gửi trùng.

### 5.2. Schema SQL

```sql
create extension if not exists pgcrypto;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  title text not null check (char_length(title) between 1 and 160),
  description text,
  cover_path text,
  theme_key text not null default 'graduation',
  event_date timestamptz,
  visibility text not null default 'unlisted'
    check (visibility in ('public', 'unlisted', 'private')),
  submission_mode text not null default 'approval_required'
    check (submission_mode in ('open', 'approval_required', 'closed')),
  allow_images boolean not null default true,
  allow_audio boolean not null default true,
  allow_ai boolean not null default true,
  max_wish_length integer not null default 1000
    check (max_wish_length between 50 and 5000),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  deleted_at timestamptz
);

create index idx_events_owner on public.events(owner_id, created_at desc);
create index idx_events_visible_slug on public.events(slug)
  where deleted_at is null;

create table public.wishes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  client_request_id uuid not null,
  sender_name text not null check (char_length(sender_name) between 1 and 100),
  sender_avatar_path text,
  content text,
  moderation_status text not null default 'pending'
    check (moderation_status in ('pending', 'approved', 'rejected', 'hidden')),
  is_pinned boolean not null default false,
  moderation_reason text,
  moderated_by uuid references auth.users(id) on delete set null,
  moderated_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(event_id, client_request_id),
  check (content is null or char_length(content) <= 5000)
);

create index idx_wishes_public_wall
  on public.wishes(event_id, is_pinned desc, created_at desc)
  where moderation_status = 'approved' and deleted_at is null;

create index idx_wishes_moderation_queue
  on public.wishes(event_id, moderation_status, created_at desc)
  where deleted_at is null;

create table public.wish_media (
  id uuid primary key default gen_random_uuid(),
  wish_id uuid not null references public.wishes(id) on delete cascade,
  storage_bucket text not null,
  storage_path text not null unique,
  media_type text not null check (media_type in ('image', 'audio')),
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  width integer,
  height integer,
  duration_ms integer,
  processing_status text not null default 'ready'
    check (processing_status in ('uploading', 'ready', 'failed', 'quarantined')),
  created_at timestamptz not null default now()
);

create index idx_wish_media_wish on public.wish_media(wish_id);

create table public.wish_reactions (
  id uuid primary key default gen_random_uuid(),
  wish_id uuid not null references public.wishes(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete cascade,
  actor_key_hash text,
  emoji text not null check (emoji in ('🎓', '❤️', '🎉', '👏')),
  created_at timestamptz not null default now(),
  check (actor_id is not null or actor_key_hash is not null)
);

create unique index uq_reaction_authenticated
  on public.wish_reactions(wish_id, actor_id, emoji)
  where actor_id is not null;

create unique index uq_reaction_guest
  on public.wish_reactions(wish_id, actor_key_hash, emoji)
  where actor_key_hash is not null;

create table public.moderation_audit_logs (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  wish_id uuid references public.wishes(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_event_time
  on public.moderation_audit_logs(event_id, created_at desc);
```

### 5.3. Vì sao không dùng cột `count` trực tiếp cho reaction

Thiết kế một dòng `(wish_id, emoji, count)` không thể xác định ai đã reaction và khó ngăn một client tăng đếm liên tục. Mô hình một reaction trên mỗi actor giúp:

- Toggle reaction rõ ràng.
- Chống duplicate bằng unique index.
- Tổng hợp số lượng bằng `count(*) group by emoji`.
- Có thể xóa reaction của một người mà không làm sai tổng.

### 5.4. Trigger cập nhật thời gian

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create trigger trg_wishes_updated_at
before update on public.wishes
for each row execute function public.set_updated_at();
```

---

## 6. Phân quyền và RLS

### 6.1. Nguyên tắc

- Owner dùng JWT của Supabase Auth và thao tác bằng role `authenticated`.
- Public chỉ được đọc sự kiện có thể truy cập và wish đã `approved`.
- Guest không được insert trực tiếp vào bảng `wishes` trong phương án production; mọi submission đi qua Edge Function.
- Service role chỉ tồn tại ở server và không bao giờ được đưa vào biến môi trường public.
- Policy phải chỉ rõ role và dùng cả `USING` lẫn `WITH CHECK` khi cần.

### 6.2. Policies cho events

```sql
alter table public.events enable row level security;
alter table public.wishes enable row level security;
alter table public.wish_media enable row level security;
alter table public.wish_reactions enable row level security;
alter table public.moderation_audit_logs enable row level security;

create policy "public can read accessible events"
on public.events
for select
to anon, authenticated
using (
  deleted_at is null
  and archived_at is null
  and visibility in ('public', 'unlisted')
);

create policy "owners can read own events"
on public.events
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "owners can create events"
on public.events
for insert
to authenticated
with check ((select auth.uid()) = owner_id);

create policy "owners can update own events"
on public.events
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "owners can delete own events"
on public.events
for delete
to authenticated
using ((select auth.uid()) = owner_id);
```

### 6.3. Policies cho wishes

```sql
create policy "public can read approved wishes"
on public.wishes
for select
to anon, authenticated
using (
  moderation_status = 'approved'
  and deleted_at is null
  and exists (
    select 1
    from public.events e
    where e.id = wishes.event_id
      and e.deleted_at is null
      and e.archived_at is null
      and e.visibility in ('public', 'unlisted')
  )
);

create policy "owners can read all event wishes"
on public.wishes
for select
to authenticated
using (
  exists (
    select 1
    from public.events e
    where e.id = wishes.event_id
      and e.owner_id = (select auth.uid())
  )
);

create policy "owners can moderate event wishes"
on public.wishes
for update
to authenticated
using (
  exists (
    select 1
    from public.events e
    where e.id = wishes.event_id
      and e.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.events e
    where e.id = wishes.event_id
      and e.owner_id = (select auth.uid())
  )
);

create policy "owners can delete event wishes"
on public.wishes
for delete
to authenticated
using (
  exists (
    select 1
    from public.events e
    where e.id = wishes.event_id
      and e.owner_id = (select auth.uid())
  )
);
```

Không tạo policy `FOR INSERT WITH CHECK (true)` cho public. Policy đó cho phép client tự truyền các trường như `moderation_status`, `is_pinned` hoặc `approved_at` nếu không có thêm lớp bảo vệ.

### 6.4. Submission qua Edge Function

Edge Function `submit-wish` thực hiện:

1. Parse và validate input bằng schema.
2. Xác minh CAPTCHA token.
3. Kiểm tra sự kiện tồn tại và đang nhận lời chúc.
4. Rate limit theo event, IP hash và device/session key.
5. Kiểm tra `client_request_id` để bảo đảm idempotency.
6. Xác minh storage path thuộc submission session hiện tại.
7. Chuẩn hóa nội dung và phát hiện link/spam cơ bản.
8. Tự đặt `moderation_status`.
9. Insert bằng service role.
10. Trả response tối thiểu, không làm lộ thông tin moderation nội bộ.

Ví dụ response:

```json
{
  "wishId": "uuid",
  "status": "pending",
  "message": "Lời chúc đã được gửi và đang chờ duyệt."
}
```

---

## 7. Media Storage Pipeline

### 7.1. Cấu trúc bucket

**Phương án khuyến nghị:**

- `event-media-private`: file mới tải lên, file chưa duyệt và audio cần kiểm soát.
- `event-media-public`: bản đã duyệt và cho phép truy cập công khai, nếu cần CDN/cache đơn giản.
- `yearbook-exports`: PDF private, chỉ tải qua signed URL.

### 7.2. Cấu trúc path

```text
{event_id}/{submission_id}/{random_uuid}.{ext}
```

Không dùng trực tiếp tên file do người dùng cung cấp. Tên gốc chỉ được lưu trong metadata sau khi đã sanitize nếu thực sự cần.

### 7.3. Giới hạn đề xuất

| Loại | Giới hạn client | Giới hạn server |
|---|---:|---:|
| Ảnh | Resize cạnh dài tối đa 1600–1920 px | 5 MB/file |
| Audio | Tối đa 60–90 giây | 8 MB/file |
| Số media/wish | 1 ở MVP | 1 ở MVP |
| Nội dung text | 1.000 ký tự mặc định | Theo `events.max_wish_length` |

Client-side compression chỉ là tối ưu trải nghiệm; server vẫn phải xác minh MIME type, size, extension và magic bytes khi có pipeline xử lý file.

### 7.4. Xử lý file mồ côi

- Mỗi upload có `submission_id` và thời điểm tạo.
- Cron job xóa file không liên kết với `wish_media` sau một khoảng thời gian an toàn, ví dụ 24 giờ.
- Job phải chạy theo batch và ghi log số file đã xóa.
- Không xóa tự động media của wish `rejected` nếu hệ thống còn cần audit; áp dụng retention policy rõ ràng.

---

## 8. Realtime và đồng bộ giao diện

### 8.1. MVP

- Dùng Supabase Postgres Changes.
- Subscription lọc theo `event_id`.
- RLS bảo đảm public chỉ nhận record được phép đọc.
- Client xử lý `INSERT`, `UPDATE`, `DELETE` theo `id`.
- Khi `pending -> approved`, thêm item.
- Khi `approved -> hidden/rejected`, xóa item khỏi wall.
- Dùng map hoặc normalized state để tránh duplicate.

```typescript
const channel = supabase
  .channel(`event-wall:${eventId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'wishes',
      filter: `event_id=eq.${eventId}`,
    },
    (payload) => reconcileWishChange(payload),
  )
  .subscribe()
```

### 8.2. Khi mở rộng

Khi số lượng subscriber hoặc tần suất thay đổi tăng đáng kể:

- Dùng Database Trigger phát Realtime Broadcast theo topic `event:{event_id}`.
- Chỉ phát payload public tối thiểu.
- Tách counter, notification và analytics khỏi luồng render chính.
- Đo throughput thực tế trước khi nâng cấp kiến trúc.

### 8.3. Trạng thái mất kết nối

- Hiển thị indicator nhỏ khi Realtime bị mất kết nối.
- Tự reconnect theo exponential backoff.
- Sau khi reconnect, refetch trang dữ liệu mới nhất để bù các event bị bỏ lỡ.
- Không dùng Realtime như nguồn dữ liệu duy nhất; database query vẫn là source of truth.

---

## 9. AI Writing Assistant

### 9.1. Endpoint

`POST /functions/v1/generate-ai-wish`

Input:

```json
{
  "eventId": "uuid",
  "recipientName": "Khánh Minh",
  "relation": "Bạn cùng nhóm đồ án",
  "tone": "Hài hước nhưng chân thành",
  "details": "Nhắc về những đêm thức khuya sửa lỗi"
}
```

Output:

```json
{
  "suggestions": [
    "...",
    "...",
    "..."
  ]
}
```

### 9.2. Yêu cầu kỹ thuật

- Giới hạn chiều dài input.
- Rate limit theo user/session/event.
- Timeout và retry có giới hạn.
- Yêu cầu structured JSON output nếu provider hỗ trợ.
- Validate output trước khi trả về client.
- Không tự động lưu lời chúc AI vào database.
- Không gửi email, số điện thoại, media hoặc dữ liệu không cần thiết sang AI provider.
- Có fallback mẫu tĩnh khi dịch vụ AI lỗi.

### 9.3. Prompt đề xuất

```text
Bạn là trợ lý viết lời chúc cho một sự kiện tốt nghiệp.
Hãy tạo đúng 3 lời chúc bằng tiếng Việt.
Mỗi lời chúc tối đa 80 từ, tự nhiên, không sáo rỗng và không chứa nội dung xúc phạm.

Người nhận: {{recipientName}}
Mối quan hệ: {{relation}}
Giọng điệu: {{tone}}
Chi tiết nên nhắc tới: {{details}}

Trả về JSON theo cấu trúc:
{"suggestions":["...","...","..."]}
Không thêm giải thích bên ngoài JSON.
```

Không cam kết thời gian phản hồi cố định; UI nên có loading state, nút thử lại và khả năng tiếp tục nhập thủ công.

---

## 10. Yearbook Export Engine

### 10.1. MVP: Browser Print

- Route `/e/[slug]/print` dùng layout tuyến tính, không dùng Masonry.
- Dùng `@page`, `break-inside: avoid`, page header/footer và typography dành cho in.
- Owner mở trang print rồi dùng `window.print()`.
- Ảnh được tải ở kích thước phù hợp trước khi in.

Ưu điểm: nhanh triển khai, chi phí thấp.  
Hạn chế: kết quả phụ thuộc trình duyệt và người dùng phải thao tác thủ công.

### 10.2. Production: Server PDF Job

Không chạy Chromium/Playwright trực tiếp trong Edge Function nếu workload vượt giới hạn tài nguyên. Dùng một worker Node.js hoặc dịch vụ render chuyên biệt có hỗ trợ headless browser.

Quy trình:

1. Tạo `export_jobs` với trạng thái `queued`.
2. Worker lấy job, tạo token một lần cho route print.
3. Render PDF với font đã preload và media đã xác minh.
4. Upload file vào `yearbook-exports`.
5. Cập nhật `completed` hoặc `failed`.
6. Trả signed URL có thời hạn cho owner.

### 10.3. Yêu cầu bảo mật

- Route print private không được dựa vào slug đơn thuần.
- Export token có thời hạn ngắn, scope theo event và dùng một lần nếu có thể.
- PDF không chứa lời chúc `pending`, `rejected`, `hidden` hoặc đã xóa.
- Escape toàn bộ HTML do người dùng nhập.

---

## 11. UI/UX Blueprint

### 11.1. Public Event Wall — `/e/[slug]`

**Khu vực chính**

- Cover, title, description và ngày sự kiện.
- CTA “Gửi lời chúc”.
- Filter: tất cả, văn bản, ảnh, ghi âm.
- Pinned wishes.
- Wall dạng responsive columns hoặc grid.
- QR code và nút chia sẻ.

**Trạng thái bắt buộc**

- Loading skeleton.
- Event not found.
- Event archived/closed.
- Empty wall.
- Realtime disconnected.
- Media unavailable.

### 11.2. Wish Composer

MVP có thể dùng hai bước thay vì ba bước để giảm thao tác:

**Bước 1 — Nội dung**

- Textarea.
- Chọn ảnh hoặc ghi âm.
- Nút AI suggestion.
- Character counter.

**Bước 2 — Người gửi và xác nhận**

- Tên hiển thị.
- Avatar tùy chọn.
- Preview.
- CAPTCHA khi cần.
- Submit.

**UX yêu cầu**

- Không làm mất nội dung khi upload lỗi.
- Hiển thị progress theo file.
- Cho phép hủy ghi âm.
- Xác nhận rõ “Đã hiển thị” hoặc “Đang chờ duyệt”.
- Khóa nút submit trong lúc request đang xử lý, đồng thời vẫn dùng idempotency ở server.

### 11.3. Owner Dashboard

Các tab:

1. Overview.
2. Moderation.
3. Appearance.
4. Sharing & QR.
5. Export.
6. Settings.

Moderation Queue cần:

- Filter status và loại media.
- Search theo tên/ngày.
- Preview media an toàn.
- Approve, reject, hide, pin.
- Bulk action.
- Undo trong thời gian ngắn hoặc xác nhận với hành động phá hủy.
- Audit history tối thiểu.

### 11.4. Accessibility

- Mọi thao tác dùng được bằng bàn phím.
- Modal giữ focus và trả focus khi đóng.
- Nút icon có accessible label.
- Không chỉ dùng màu để biểu thị status.
- Tôn trọng `prefers-reduced-motion`; tắt confetti/animation mạnh khi người dùng yêu cầu giảm chuyển động.
- Audio có control chuẩn và transcript tùy chọn ở giai đoạn sau.

---

## 12. Chống spam và lạm dụng

Áp dụng defense-in-depth:

1. CAPTCHA/Turnstile ở submission endpoint.
2. Rate limit theo nhiều khóa: event, IP hash, session/device và account.
3. Giới hạn kích thước request body.
4. Giới hạn số URL trong nội dung.
5. Block các MIME type không hỗ trợ.
6. Randomized storage path và cấm overwrite.
7. Nội dung nghi ngờ chuyển `pending`, không auto-reject hoàn toàn nếu có nguy cơ false positive.
8. Owner có nút report/block actor ở giai đoạn sau.
9. Log chỉ lưu IP dạng hash có salt và retention ngắn nếu không có yêu cầu pháp lý khác.
10. Không hiển thị thông báo quá chi tiết khiến attacker suy ra rule nội bộ.

Rate limit `5 lời chúc/10 phút` chỉ là giá trị khởi đầu; phải cấu hình theo traffic thực tế và tách giới hạn gửi text với upload media.

---

## 13. Hiệu năng và chi phí

### 13.1. Truy vấn

- Cursor pagination theo `(created_at, id)`, không dùng offset ở danh sách lớn.
- Chỉ select các cột cần thiết cho public wall.
- Tách media metadata khỏi wish để tránh payload lớn.
- Dùng partial index cho status `approved` và moderation queue.
- Cache event metadata có revalidation; wish list vẫn được tải theo dữ liệu mới.

### 13.2. Media

- Tạo thumbnail cho public wall; chỉ tải ảnh đầy đủ khi mở lightbox.
- Dùng lazy loading.
- Không preload audio.
- Theo dõi storage và egress theo event.
- Khi đạt quota nội bộ của event, chỉ khóa upload media; vẫn cho phép text.

### 13.3. Quota

Không hard-code quota của nhà cung cấp vào business logic. Tạo bảng hoặc environment configuration cho:

- `MAX_MEDIA_BYTES_PER_EVENT`
- `MAX_IMAGE_BYTES`
- `MAX_AUDIO_BYTES`
- `MAX_AI_REQUESTS_PER_DAY`
- `RETENTION_DAYS_REJECTED`
- `RETENTION_HOURS_ORPHAN_UPLOAD`

Các giá trị có thể thay đổi theo plan triển khai.

---

## 14. Bảo mật bổ sung

- Không đưa `SUPABASE_SERVICE_ROLE_KEY` hoặc AI API key vào `NEXT_PUBLIC_*`.
- Validate session ở server trước các thao tác owner.
- Không tin `owner_id` từ request body; lấy từ session.
- Escape/sanitize dữ liệu khi render HTML hoặc PDF.
- Thiết lập CSP phù hợp cho ảnh, audio và script bên thứ ba.
- Chặn SVG upload ở MVP hoặc sanitize nghiêm ngặt.
- Không cho upload HTML.
- Signed URL có thời hạn ngắn và scope tối thiểu.
- Thiết lập backup và kiểm tra quy trình restore.
- Chạy Supabase Security Advisor và kiểm tra policy trước release.

---

## 15. Quan sát hệ thống và audit

### 15.1. Log bắt buộc

- Request ID.
- Event ID.
- Function name.
- Result code.
- Latency.
- File size/type cho upload.
- Moderation action.
- AI provider status, không log prompt chứa dữ liệu nhạy cảm đầy đủ.

### 15.2. Metrics

- Wish submission success rate.
- Pending-to-approved time.
- CAPTCHA failure rate.
- Rate-limit rejection rate.
- Realtime reconnect rate.
- Storage bytes theo event.
- AI error/timeout rate.
- PDF job completion time và failure rate.

### 15.3. Alert tối thiểu

- Submission failure tăng đột biến.
- Storage gần quota.
- Edge Function 5xx tăng.
- PDF queue bị kẹt.
- Database chuyển read-only hoặc vượt ngưỡng dung lượng.

---

## 16. Cấu trúc mã nguồn đề xuất

```text
src/
├─ app/
│  ├─ (public)/
│  │  └─ e/[slug]/
│  │     ├─ page.tsx
│  │     ├─ loading.tsx
│  │     ├─ error.tsx
│  │     └─ print/page.tsx
│  ├─ (auth)/
│  │  ├─ login/page.tsx
│  │  └─ callback/route.ts
│  ├─ dashboard/
│  │  ├─ layout.tsx
│  │  └─ events/[id]/
│  │     ├─ page.tsx
│  │     ├─ moderation/page.tsx
│  │     ├─ appearance/page.tsx
│  │     ├─ export/page.tsx
│  │     └─ settings/page.tsx
│  └─ api/
│     └─ exports/[jobId]/route.ts
├─ components/
│  ├─ event-wall/
│  ├─ wish-composer/
│  ├─ moderation/
│  └─ ui/
├─ features/
│  ├─ events/
│  ├─ wishes/
│  ├─ media/
│  ├─ reactions/
│  └─ exports/
├─ lib/
│  ├─ supabase/
│  │  ├─ client.ts
│  │  ├─ server.ts
│  │  └─ admin.ts
│  ├─ validation/
│  ├─ security/
│  └─ observability/
└─ types/

supabase/
├─ migrations/
├─ functions/
│  ├─ submit-wish/
│  └─ generate-ai-wish/
└─ seed.sql
```

`admin.ts` chỉ được import từ server-only module.

---

## 17. API Contract sơ bộ

### `POST /functions/v1/submit-wish`

**Mục đích:** Gửi wish an toàn.  
**Idempotency:** Bắt buộc `clientRequestId`.  
**Kết quả:** `approved`, `pending` hoặc error chuẩn hóa.

### `POST /functions/v1/generate-ai-wish`

**Mục đích:** Sinh ba gợi ý lời chúc.  
**Bảo vệ:** Rate limit, timeout, schema validation.

### `POST /api/exports`

**Mục đích:** Tạo PDF job.  
**Quyền:** Event owner.  
**Kết quả:** `jobId`.

### `GET /api/exports/[jobId]`

**Mục đích:** Lấy trạng thái job và signed URL khi hoàn tất.  
**Quyền:** Event owner.

---

## 18. Chiến lược kiểm thử

### 18.1. Unit test

- Validation schema.
- State transition moderation.
- Slug normalization.
- Media limit calculation.
- AI output parser.
- Reaction toggle.

### 18.2. Integration test

- RLS cho anon, authenticated owner và user không sở hữu.
- `submit-wish` không cho client tự approve.
- Idempotency khi gửi cùng `client_request_id`.
- Event closed không nhận wish.
- Media path không thuộc submission bị từ chối.
- Pending wish không xuất hiện trên public query.

### 18.3. End-to-end test

1. Owner tạo sự kiện.
2. Guest mở link và gửi text.
3. Wish vào pending.
4. Owner duyệt.
5. Public wall nhận cập nhật.
6. Guest reaction.
7. Owner xuất trang print/PDF.

Kiểm thử thêm trên mobile Safari/Chrome cho MediaRecorder, permission denial và mạng chậm.

---

## 19. Kế hoạch triển khai theo phase

### Phase 1 — Foundation

- Next.js App Router và Supabase SSR Auth.
- Schema, migration, RLS.
- Event CRUD.
- Public wall text-only.

### Phase 2 — Submission & Moderation

- Edge Function `submit-wish`.
- CAPTCHA và rate limit.
- Dashboard moderation.
- Realtime MVP.

### Phase 3 — Media

- Signed upload.
- Image compression.
- Audio recording.
- Orphan cleanup.

### Phase 4 — AI & Reaction

- AI suggestion endpoint.
- Reaction model theo actor.
- Metrics và abuse tuning.

### Phase 5 — Export & Hardening

- Print stylesheet.
- PDF job worker.
- Audit log.
- Load test, security review và restore drill.

---

## 20. Tiêu chí nghiệm thu MVP

- Public không đọc được wish chưa duyệt.
- Client không thể tự đặt wish thành approved hoặc pinned.
- User không sở hữu không thể sửa event hoặc moderation wish.
- Gửi lại cùng request ID không tạo bản ghi trùng.
- Event đóng không nhận wish mới.
- Upload sai MIME type hoặc vượt dung lượng bị chặn.
- Wish đã duyệt xuất hiện trên wall mà không cần reload trong điều kiện Realtime hoạt động.
- Khi Realtime mất kết nối, reload/refetch vẫn cho dữ liệu đúng.
- Dashboard hỗ trợ duyệt hàng loạt.
- Trang public hoạt động tốt trên mobile.
- AI lỗi không chặn việc gửi lời chúc thủ công.
- Export không chứa nội dung chưa duyệt.
- Có migration, seed, test RLS và hướng dẫn environment.

---

## 21. Các quyết định kiến trúc quan trọng

| Quyết định | Lý do |
|---|---|
| Submission đi qua Edge Function | Chặn client kiểm soát trạng thái và gom CAPTCHA/rate limit/validation |
| Media chưa duyệt để private | Tránh lộ file qua URL trước kiểm duyệt |
| Lưu storage path thay vì URL | Dễ đổi bucket, CDN hoặc signed URL strategy |
| Reaction theo actor | Chống duplicate và hỗ trợ toggle chính xác |
| Postgres Changes cho MVP | Triển khai nhanh, đủ cho lưu lượng nhỏ |
| Broadcast khi scale | Kiểm soát payload và giảm gánh nặng authorization theo subscriber |
| Browser print trước, PDF worker sau | Giảm độ phức tạp MVP, tránh ép headless browser vào edge runtime |
| Soft delete + audit cho moderation | Hỗ trợ truy vết và giảm rủi ro xóa nhầm |
| Quota cấu hình, không hard-code plan | Nhà cung cấp và gói dịch vụ có thể thay đổi |

---

## 22. Kết luận

Kiến trúc Next.js App Router kết hợp Supabase phù hợp với Graduation Message vì cho phép triển khai nhanh, hỗ trợ server rendering, xác thực, PostgreSQL, Storage và Realtime trong một hệ sinh thái thống nhất. Tuy nhiên, mức độ an toàn của hệ thống phụ thuộc chủ yếu vào việc không cho client trực tiếp quyết định các trường nhạy cảm.

Phiên bản blueprint này ưu tiên ba lớp bảo vệ:

1. Validation và abuse control tại endpoint gửi lời chúc.
2. Constraint, transaction và RLS tại database.
3. Kiểm soát quyền truy cập media và dữ liệu công khai.

Với cách phân phase trên, dự án có thể hoàn thành MVP gọn, dễ kiểm thử và vẫn có đường mở rộng sang PDF service, Broadcast, analytics, multi-owner và thương mại hóa trong tương lai.
