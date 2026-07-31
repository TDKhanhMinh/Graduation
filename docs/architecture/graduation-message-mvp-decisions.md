# Architecture Decision Record: MVP Core Decisions

**Status:** Approved  
**Date:** 2026-07-30  
**Context:** `docs/graduation-message-technical-blueprint-v2.md` mô tả kiến trúc tổng thể nhưng để lại các lựa chọn có thể dẫn đến implementation khác nhau. ADR này là contract bắt buộc cho Phase 1–5.

Các mục có nhãn **MUST** là quyết định MVP đã chốt, không phải danh sách phương án. Muốn thay đổi một mục MUST phải cập nhật ADR, nêu migration/rollback và chạy lại các security acceptance tests liên quan.

---

## 1. Access Matrix (Role × Operation × Resource)

Mọi quyền public chỉ áp dụng qua projection/command được nêu ở mục 3 và 4. Service worker phải dùng credential server-only, scope theo job/event; không có quyền tổng quát từ client.

| Resource | Anon (Guest) | Owner (Creator) | Non-Owner (Auth'd) | Service Worker (Edge/Node) |
|---|---|---|---|---|
| **Event (Public)** | Read public projection; có thể được liệt kê | Read, update, soft-delete | Read public projection | Read theo scope |
| **Event (Unlisted)** | Read public projection khi truy vấn đúng slug; không được liệt kê | Read, update, soft-delete | Như anon | Read theo scope |
| **Event (Private)** | Deny | Read, update, soft-delete | Deny | Read theo event/job scope |
| **Wish (Approved)** | Read public projection; reaction qua command | Read; moderate/soft-delete qua command | Như anon | Read/update theo job scope |
| **Wish (Pending)** | Deny | Read; moderate qua command | Deny | Insert/update theo submission/job scope |
| **Wish (Hidden/Rejected)** | Deny | Read; moderate qua command | Deny | Read/update theo job scope |
| **Wish Media** | Signed read khi wish đang approved | Signed read; delete qua command | Như anon | Insert/read/delete theo path scope |
| **Moderation Logs** | Deny | Read cho event sở hữu | Deny | Insert; read theo event scope |

**MUST:** RLS, explicit grants và command authorization cùng thực thi ma trận này. UI/middleware không được xem là authorization boundary.

**Trade-off:** Quyền hẹp tạo thêm RPC/server command.
**Rollback:** Nếu command layer lỗi, vô hiệu command bị ảnh hưởng; không mở rộng table grants để chữa cháy.

---

## 2. Event Visibility Definitions

- **Public — MUST:** Có thể lookup theo slug và có thể xuất hiện trong endpoint liệt kê/search sau này. Chỉ public projection được trả về.
- **Unlisted — MUST:** Link-only. Lookup exact slug được phép, nhưng mọi list/search/sitemap/query discovery phải lọc bỏ `unlisted`. Slug dùng ít nhất 128 bit entropy hoặc random token tương đương; không dùng slug tuần tự.
- **Private — MUST:** Chỉ owner hoặc service worker có scope mới đọc được. Biết slug không tạo quyền. Dữ liệu private không xuất hiện trong public projection, Realtime topic, sitemap hoặc metadata cache dùng chung.

**Trade-off:** Unlisted không phải authentication và vẫn có thể bị chia sẻ link.
**Rollback:** Owner có thể đổi `unlisted` thành `private`; cache/public topic liên quan phải invalidated.

---

## 3. Public-Safe Data Contract

### 3.1. Public query surface

**MUST:** Public wall đọc wish qua PostgreSQL view `public.public_wishes_view` bên trong server-only DAL, không đọc trực tiếp `public.wishes` từ browser. View chỉ cho phép:

- `id`
- `event_id`
- `sender_name`
- `sender_avatar_path`
- `content`
- `is_pinned`
- `created_at`

Public event response dùng allowlist tương tự và không trả `owner_id`, private `settings`, audit fields hoặc internal storage path.

**MUST NOT:** Public payload, error, log hoặc Realtime message không được chứa `author_id`, `client_request_id`, `moderation_reason`, `moderated_by`, `moderated_at`, `actor_key_hash`, IP hash hoặc service metadata.

### 3.2. Grants and server queries

- `anon` và browser `authenticated` không có `SELECT` trên base tables hoặc global projection. Điều này ngăn list toàn bộ wish/event của link `unlisted`.
- Server-only DAL dùng service role để lookup exact slug, đọc projection theo event ID và trả DTO allowlist. DAL phải được đánh dấu `server-only`.
- Owner đọc base tables bằng session client và RLS; các mutation nhạy cảm vẫn đi qua command.
- Service-role query không được trả nguyên row ra client.
- Mọi thay đổi projection phải có forbidden-column regression test.

**Trade-off:** Public read phụ thuộc Server Component/DAL thay vì browser query trực tiếp, đổi lại `unlisted` không bị enumeration qua Data API.
**Rollback:** Revoke projection lỗi; server tạm dùng allowlist base-table query tương đương. Không cấp public access trên base table hoặc global view.

---

## 4. Owner Moderation Command

**MUST:** Owner không có table-level `UPDATE` tự do trên `public.wishes`. Mọi moderation đi qua một command/RPC transaction kiểm soát, ví dụ `moderate_wish`.

Command chỉ được thay đổi:

- `moderation_status`
- `is_pinned`
- `moderation_reason`
- `moderated_at`
- `moderated_by`
- `deleted_at` đối với soft-delete

Command không được thay đổi `id`, `event_id`, `author_id`, `client_request_id`, `sender_name`, `sender_avatar_path`, `content` hoặc timestamps hệ thống khác. Command phải:

1. Xác minh owner từ JWT/server session, không nhận `owner_id` đáng tin từ body.
2. Lock wish cần sửa trong transaction ngắn.
3. Validate state transition và invariant `is_pinned` chỉ hợp lệ khi `approved`.
4. Ghi moderation audit log trong cùng transaction.
5. Trả public-safe/owner-safe DTO, không trả row tùy ý.

**Trade-off:** Moderation cần thêm command và test state machine.
**Rollback:** Disable/revoke execute command khi phát hiện lỗi; không cấp table UPDATE trực tiếp cho owner.

---

## 5. Technical Stack Decisions

### 5.1. Reaction guest identity

**MUST:** Server cấp cookie `gm_guest` chứa random token tối thiểu 128 bit, `HttpOnly`, `Secure` ở production, `SameSite=Lax`, path `/`. Server tính `actor_key_hash = HMAC-SHA-256(GUEST_ACTOR_SECRET, token)`; database chỉ lưu hash. Không dùng LocalStorage ID làm identity có thẩm quyền và không tạo Supabase anonymous auth user.

Rotation secret hỗ trợ current + previous key trong một cửa sổ ngắn; reaction command mới ghi/xóa reaction sau khi validate wish public.

**Trade-off:** Xóa cookie làm guest có identity mới.
**Rollback:** Revoke reaction command hoặc rotate secret; không cần migration PII.

### 5.2. Rate-limit store

**MUST:** MVP dùng bảng unlogged `private.rate_limit_counters` trong PostgreSQL, keyed theo HMAC của `event + IP/session/account + action`, có window/expiry và cleanup job. Edge/server function gọi command atomic để increment/check. Không dùng process memory vì serverless có nhiều instance; không phụ thuộc vendor KV trả phí.

IP thô không được lưu. Rate-limit record có retention ngắn và không được expose qua Data API.

**Trade-off:** Unlogged data mất khi PostgreSQL restart; điều này chỉ tạm nới rate limit, không làm mất business data.
**Rollback/scale path:** Có thể chuyển implementation sang Redis/KV sau đo tải, giữ nguyên command contract và hashing semantics.

### 5.3. Realtime invalidation and removal

**MUST:** Public client không subscribe payload nguyên row của `public.wishes`. Database phát public-safe invalidation theo topic event với payload tối thiểu `{ event_id, wish_id, kind }`, trong đó `kind` là `upsert` hoặc `remove`. Client nhận invalidation rồi refetch `public.public_wishes_view`, reconcile theo `id` và gỡ item không còn trong projection.

- `pending -> approved`: phát `upsert`.
- `approved -> hidden/rejected`, soft-delete hoặc hard-delete: phát `remove`.
- Reconnect: refetch cursor/page hiện tại; Realtime không phải source of truth.
- P2-T05 phải có integration test chứng minh không lộ forbidden columns và transition removal hoạt động.

**Trade-off:** Thêm một refetch so với gửi nguyên row nhưng giữ payload ổn định và public-safe.
**Rollback:** Tắt channel và dùng polling/refetch; dữ liệu database vẫn là source of truth.

### 5.4. Retention and account deletion

**MUST:**

- Orphan upload chưa liên kết bị purge sau 24 giờ.
- `events` và `wishes` soft-delete bằng `deleted_at`; dữ liệu và media soft-deleted purge sau 30 ngày.
- Yêu cầu xóa account chạy server workflow: đánh dấu toàn bộ event/wish của owner là deleted, revoke session/khóa thao tác owner, lên lịch purge, rồi mới xóa auth identity khi hết cửa sổ 30 ngày.
- Yêu cầu xóa ngay vì privacy/legal bỏ qua cửa sổ restore và purge theo transaction/job có audit không chứa nội dung đã xóa.
- Audit giữ tối thiểu actor/action/time/event reference đã pseudonymize; không giữ nội dung hoặc PII đã yêu cầu xóa.

**Trade-off:** Xóa account mặc định không hoàn tất tức thì để hỗ trợ restore/audit.
**Rollback:** Trong 30 ngày, owner có thể restore nếu chưa có yêu cầu xóa ngay; sau purge không có application-level restore.

### 5.5. PDF worker boundary

**MUST:** PDF chạy trong Node.js worker/runtime có headless browser, tách khỏi Supabase Edge Functions. Worker claim job bằng lease ngắn, render snapshot approved, upload vào private `yearbook-exports` và dùng one-time token scope theo event/job cho route print.

Default deployment là Node.js serverless/container của cùng project; vendor cụ thể là deployment concern, không thay đổi contract.

**Trade-off:** Có thêm worker và queue state.
**Rollback:** Browser print vẫn là fallback MVP; dừng worker không ảnh hưởng tạo/đọc wish.

### 5.6. Media storage buckets

**MUST:**

- `event-media`: private bucket cho cả pending và approved media. Public chỉ nhận signed URL ngắn hạn sau khi wish được xác nhận vẫn approved.
- `yearbook-exports`: private bucket cho PDF. Chỉ owner hoặc worker đúng job nhận signed URL/token.

Không copy file sang public bucket trong MVP.

**Trade-off:** Signed URL tăng request server và khó cache lâu.
**Rollback/scale path:** Có thể tạo public derivative bucket sau khi có malware/moderation pipeline; source private vẫn là canonical.

---

## 6. Dependency Validation

P1-T01 là contract dependency trực tiếp hoặc bắc cầu của 29 task còn lại. Bảng dưới đối chiếu dependency trong Task Contract với mục ADR bắt buộc phải được dùng khi triển khai/review.

| Task | Direct dependencies | ADR contract consumed |
|---|---|---|
| P1-T02 | P1-T01 | 1, 2, 3, 4 |
| P1-T03 | P1-T02 | 1–5: fixtures và negative security tests |
| P1-T04 | P1-T01, P1-T03 | 3; 5.1–5.2: server-only secret/logging |
| P1-T05 | P1-T02, P1-T03, P1-T04 | 1–3: event lookup/auth DTO |
| P1-T06 | P1-T05 | 1, 2, 4, 5.4 |
| P1-T07 | P1-T05 | 2, 3, 5.3 |
| P1-T08 | P1-T06, P1-T07 | 1–5: Foundation security gate |
| P2-T01 | P1-T02, P1-T03, P1-T04, P1-T05 | 3, 5.1, 5.2 |
| P2-T02 | P1-T07, P2-T01 | 3, 5.1 |
| P2-T03 | P1-T02, P1-T04, P1-T05 | 1, 4, 5.3 |
| P2-T04 | P1-T06, P2-T03 | 1, 4 |
| P2-T05 | P1-T07, P2-T03 | 3, 5.3 |
| P2-T06 | P1-T08, P2-T01, P2-T02, P2-T04, P2-T05 | 1, 3, 4, 5.1–5.3 |
| P3-T01 | P1-T01, P1-T02, P1-T03, P1-T04, P2-T01 | 1–3, 5.4, 5.6 |
| P3-T02 | P2-T02, P3-T01 | 3, 5.6 |
| P3-T03 | P2-T02, P3-T01 | 3, 5.6 |
| P3-T04 | P3-T01 | 5.4, 5.6 |
| P3-T05 | P2-T04, P2-T05, P3-T02, P3-T03, P3-T04 | 3, 4, 5.3, 5.6 |
| P4-T01 | P1-T04, P1-T05, P2-T01 | 3, 5.2 |
| P4-T02 | P2-T02, P4-T01 | 3, 5.2 |
| P4-T03 | P1-T02, P1-T03, P1-T04, P1-T07 | 3, 5.1 |
| P4-T04 | P2-T05, P4-T03 | 3, 5.1, 5.3 |
| P4-T05 | P2-T06, P3-T05, P4-T01, P4-T02, P4-T03, P4-T04 | 5.1–5.3 |
| P5-T01 | P1-T07, P3-T05 | 1–3, 5.5 |
| P5-T02 | P1-T02, P1-T04, P1-T05, P3-T05 | 1, 3, 5.4, 5.5 |
| P5-T03 | P5-T01, P5-T02 | 3, 5.5, 5.6 |
| P5-T04 | P1-T06, P5-T02, P5-T03 | 1, 3, 5.5 |
| P5-T05 | P2-T06, P3-T05, P4-T05, P5-T03 | Toàn bộ security, retention và rollback contract |
| P5-T06 | P4-T05, P5-T04, P5-T05 | Toàn bộ ADR và release gates |

**Gate:** Nếu một task cần hành vi khác bảng trên, task đó phải bị Blocked cho tới khi ADR được cập nhật; không được tự chọn phương án trong implementation.
