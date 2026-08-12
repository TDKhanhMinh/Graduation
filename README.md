# Memoria — Graduation Message Platform

Memoria là nền tảng web để tạo một không gian kỷ niệm cho sự kiện: chủ sự kiện tạo trang công khai, chia sẻ bằng URL/QR, nhận lời chúc và media từ khách mời, sau đó quản lý nội dung, poster và các bản xuất dữ liệu trong dashboard.

README này được viết lại sau khi scan source, migration, Edge Functions, worker, tài liệu vận hành và Git history của repository vào ngày **2026-08-12**. Tài liệu mô tả trạng thái hiện tại trong checkout; các tài liệu thiết kế cũ trong `docs/` có thể vẫn chứa ý tưởng hoặc release gate chưa được xác nhận runtime.

## Trạng thái nhanh

| Hạng mục | Hiện trạng |
| --- | --- |
| Package | `graduation-frontend` — private package |
| Frontend | Next.js `16.2.12`, React `19.2.4`, TypeScript strict |
| Backend | Supabase Auth, PostgreSQL, RLS, Storage, Realtime, Edge Functions |
| UI | Tailwind CSS 4, Base UI, shadcn/ui configuration, Lucide, Framer Motion, Sonner |
| Media | Cloudinary cho cover sự kiện; Supabase private Storage cho wish media/poster/export |
| PDF | Worker Node.js độc lập dùng Puppeteer |
| Static scan | 269 file trong `src/`, 15 API route handlers, 14 dashboard pages, 31 migrations, 8 pgTAP files |
| `npm run typecheck` | Pass tại thời điểm scan |
| `npm run lint` | 0 error, 5 warning về unused variables |
| Unit/E2E | Checkout hiện không có unit test thực thi hoặc Playwright suite; `test:unit` chỉ là placeholder |
| Production release | Chưa được xác nhận đầy đủ về DB/RLS, browser, Edge runtime, PDF worker và build production |

## Sản phẩm làm gì?

### Chủ sự kiện

- Đăng ký, đăng nhập email, Google OAuth, đăng xuất một thiết bị hoặc toàn bộ phiên.
- Tạo và chỉnh sửa sự kiện với slug, mô tả, ngày/giờ, timezone IANA, địa điểm, host và trạng thái hiển thị.
- Chọn `public`, `unlisted` hoặc `private` theo visibility contract; sự kiện unlisted có `noindex` và chỉ được truy cập qua slug chính xác.
- Chọn chế độ nhận lời chúc: mở, cần duyệt hoặc đóng; cấu hình giới hạn độ dài, ảnh, audio và AI assistant.
- Tùy biến Welcome Hero, theme, cover, hiệu ứng, QR CTA và animation quality.
- Dùng Poster Studio để tạo poster, lưu document có revision, quản lý poster assets và chuyển draft từ landing page sang editor.
- Kiểm duyệt lời chúc, pin/xóa theo quyền, xem audit history và nhận notification cho wish đang chờ duyệt.
- Chia sẻ event bằng URL/QR; xem Insights theo khoảng thời gian và timezone.
- Xuất snapshot event thành CSV/JSON hoặc tạo PDF export job bất đồng bộ.
- Mở Director Mode để điều khiển một màn hình trình chiếu qua session token và protocol version.
- Mời collaborator với role `editor`, `moderator` hoặc `viewer`.
- Trong Privacy Center: cập nhật profile, tải personal-data export, đăng xuất toàn bộ phiên và tạo yêu cầu xóa tài khoản với cooling-off 30 ngày.

### Khách mời

- Mở trang sự kiện tại `/e/[slug]` và xem Welcome Experience theo trạng thái sự kiện.
- Xem thông tin ngày giờ, địa điểm, host, cover, theme, hiệu ứng và QR/share controls.
- Soạn lời chúc; draft được lưu local trên thiết bị cho tới khi gửi thành công.
- Có thể đính kèm ảnh/audio nếu event cho phép; upload dùng private Storage và upload session có quota.
- Xác thực Turnstile, rate limit theo IP/device đã hash và gửi qua transaction RPC.
- Dùng AI assistant để nhận ba gợi ý lời chúc tiếng Việt khi event bật `allow_ai`; có static fallback khi thiếu OpenAI key hoặc provider lỗi.

Public wish wall/RealtimeWall hiện **được tắt render có chủ đích trong** `src/app/(public)/e/[slug]/page.tsx` để bảo vệ thông tin người gửi. DAL, component và migration liên quan vẫn tồn tại cho lần bật lại sau khi có quyết định privacy/runtime mới.

## Kiến trúc tổng thể

```text
Browser
  ├─ Next.js App Router pages/layouts
  ├─ Client Components, Server Actions, Route Handlers
  └─ Supabase browser client / Edge Function invocation
          │
          ▼
Next.js server
  ├─ Supabase SSR client với publishable key + cookie session
  ├─ server-only DAL/features và Server Actions
  ├─ admin client với service-role key cho boundary đặc quyền
  └─ API contracts, validation, metadata, signed URLs/tokens
          │
          ├─ Supabase Auth
          ├─ PostgreSQL + RLS + RPC + private schema
          ├─ Supabase private Storage / Realtime
          └─ Edge Functions: submit, upload session, AI, cleanup

PDF export queue ──RPC/lease──► workers/pdf ──Puppeteer──► print route ──► private bucket
```

### Next.js

- Dùng App Router trong `src/app/`, route groups `(public)`, dynamic segments `[id]`, `[slug]`, layouts, loading UI, error boundaries và `not-found`.
- `src/proxy.ts` cập nhật session cookie trước request, redirect truy cập `/dashboard` chưa xác thực về `/auth/login`, nhưng không được xem là authorization boundary.
- `src/lib/auth/dal.ts` xác minh danh tính bằng `supabase.auth.getClaims()`.
- Mutation quan trọng tự xác minh session/quyền trong Server Action hoặc Route Handler; không dựa vào visibility của UI.
- `generateMetadata`, `robots.ts`, `sitemap.ts`, `opengraph-image.tsx` và `twitter-image.tsx` cung cấp metadata/SEO/share assets.
- `next.config.ts` cấu hình CSP, security headers và remote image patterns cho Cloudinary/Supabase.

### Supabase client boundaries

- `src/lib/supabase/client.ts`: browser client, chỉ dùng publishable key.
- `src/lib/supabase/server.ts`: request-scoped SSR client, đọc/ghi cookie qua Next.js.
- `src/lib/supabase/admin.ts`: server-only service-role client, bypass RLS; không được truyền dữ liệu chưa validate trực tiếp xuống browser.
- `src/lib/supabase/proxy.ts`: refresh cookie/session ở Proxy.
- `src/types/database.ts`: generated TypeScript database contract; regenerate từ schema local, không sửa tay.

## Route map

### Web pages

| URL | Vai trò |
| --- | --- |
| `/` | Landing page và product story của Memoria |
| `/auth/login` | Đăng nhập email/Google |
| `/auth/sign-up` | Tạo tài khoản |
| `/auth/callback` | Hoàn tất PKCE/email confirmation |
| `/auth/invitations/[inviteId]` | Nhận lời mời collaborator |
| `/dashboard` | Danh sách event của người dùng |
| `/dashboard/events/new` | Tạo event |
| `/dashboard/events/[id]` | Tổng quan event |
| `/dashboard/events/[id]/settings` | Thông tin, schedule, visibility, submission config |
| `/dashboard/events/[id]/appearance` | Theme, Welcome Hero, cover và effect config |
| `/dashboard/events/[id]/poster-studio` | Editor và asset library cho poster |
| `/dashboard/events/[id]/moderation` | Queue, filter, bulk moderation và audit |
| `/dashboard/events/[id]/sharing` | URL, QR và share actions |
| `/dashboard/events/[id]/insights` | Aggregate event insights |
| `/dashboard/events/[id]/export` | CSV/JSON/PDF export center |
| `/dashboard/events/[id]/export/print` | Print view cho snapshot |
| `/dashboard/events/[id]/director` | Tạo/quản lý Director session |
| `/dashboard/events/[id]/collaborators` | Mời và phân quyền collaborator |
| `/dashboard/privacy` | Profile, session và data lifecycle |
| `/e/[slug]` | Public hoặc unlisted event page |
| `/director/[sessionId]` | Public Director display qua token |

### API Route Handlers

| Nhóm | Endpoint | Contract chính |
| --- | --- | --- |
| Account | `GET /api/account/export` | Personal-data export, private/no-store |
| Reactions | `POST /api/reactions` | Validate emoji, guest actor cookie, rate limit và toggle RPC |
| Media | `POST /api/media/public-url` | Kiểm tra media approved rồi cấp signed URL ngắn hạn |
| Collaborators | `/api/collaborators`, `/api/collaborators/[collaboratorId]` | List/create, đổi role, remove |
| Invitations | `/api/collaborators/invites/[inviteId]/accept` | Accept token một lần, có session |
| Invitations | `/api/collaborators/invites/[inviteId]/revoke` | Owner revoke invitation |
| Director | `/api/director/sessions` | Tạo session và display URL |
| Director | `/api/director/sessions/[sessionId]/commands` | Owner command với expected version/sequence |
| Director | `/api/director/sessions/[sessionId]/display` | Token-scoped display snapshot |
| Owner export | `GET /api/exports/[eventId]/[csv\|json]` | Snapshot export, giới hạn 900 wishes |
| PDF jobs | `/api/exports/jobs`, `/api/exports/jobs/[jobId]` | Create/status/cancel, idempotency key |
| PDF download | `GET /api/exports/jobs/[jobId]/download` | Signed URL chỉ cho owner và artifact completed |
| PDF print | `GET /api/exports/print/[jobId]` | One-time print token cho worker |

## Cấu trúc repository

```text
src/
├─ app/                  # Routes, layouts, pages, Server Actions, API handlers
├─ components/           # Client/server UI theo product surface
├─ features/             # DAL, schema, contract và business logic theo domain
├─ lib/                  # Auth, Supabase clients, env, logging, analytics, utilities
├─ types/database.ts     # Generated Supabase TypeScript types
└─ proxy.ts              # Next.js 16 Proxy và session refresh

supabase/
├─ migrations/           # Imperative, forward-only SQL migrations
├─ functions/            # Deno Edge Functions và shared helpers
├─ tests/database/       # pgTAP SQL security/contract tests
├─ config.toml           # Local Supabase ports, Auth, Storage, Edge Runtime
└─ seed.sql              # Dữ liệu local cho development

workers/pdf/             # Node.js + Puppeteer export worker độc lập
docs/                    # ADR, blueprint, contracts, runbooks và release gates
public/stickers/         # Static sticker assets
scripts/                 # Script hỗ trợ repository
```

### Domain modules chính

| Module | Trách nhiệm |
| --- | --- |
| `features/events` | Event schema, schedule, Welcome config, owner DAL và Server Actions |
| `features/wishes` | Public projection, keyset cursor, submission client, moderation và realtime |
| `features/reactions` | Allowed emoji, guest identity, signed cookie và reaction counts/toggle |
| `features/media` | Cover Cloudinary và media upload client |
| `features/posters` | Poster document, templates, asset pipeline, storage và quality |
| `features/exports` | Owner snapshot, CSV/JSON contract, PDF job và print token |
| `features/insights` | Range validation và aggregate insights contract |
| `features/director` | Session token, display snapshot và optimistic protocol |
| `features/collaboration` | Role matrix, access check và invitation token |
| `features/notifications` | Pending-wish inbox, unread/read và preferences |
| `features/account` | Personal export và deletion lifecycle contract |
| `features/sharing` | Public URL và QR encoding |

## Database, RLS và Storage

### Public tables và view

Schema được quản lý bởi 31 migration trong `supabase/migrations/` và generated vào `src/types/database.ts`. Các bảng chính hiện có:

- Identity/core: `profiles`, `events`, `wishes`, `wish_media`, `wish_reactions`, `moderation_audit_logs`.
- Realtime/submission: `realtime_wall_events`, `media_upload_sessions`, `cleanup_run_logs`.
- Poster: `poster_documents`, `poster_assets`, `poster_asset_upload_sessions`.
- Account/notifications: `account_deletion_requests`, `notification_events`, `notification_preferences`.
- Collaboration/director: `event_collaborators`, `event_invitations`, `director_sessions`.
- Export: `export_jobs`.
- Public projection: `public_wishes_view` chỉ chứa các trường cần cho public surface.

Schema `private` giữ các state không nên expose qua Data API, gồm các bảng counter/rate-limit và helper functions. Các RPC service-only được revoke grant mặc định, kiểm tra `auth.uid()`/scope khi cần, dùng `search_path` cố định và được gọi qua server hoặc Edge Function.

### Submission và media flow

1. Browser validate draft và xin upload session từ `create-upload-session`.
2. Function kiểm tra event còn hoạt động, submission mode, media type, quota và tạo signed upload URL vào bucket `event-media-private`.
3. Browser upload media trực tiếp bằng signed URL.
4. `submit-wish` xác minh Turnstile, giới hạn body, validate lại media, hash IP/device và gọi `submit_wish_transaction`.
5. RPC quyết định event availability, duplicate/idempotency, rate limit và moderation status trong transaction.
6. `cleanup-media` xóa orphan/rejected/deleted-event assets theo batch, cập nhật cleanup log và dọn `poster-assets-private`.

Cover event dùng Cloudinary với upload preset/client validation riêng, không được nhầm `events.cover_path` với Poster Studio assets. PDF artifacts nằm ở bucket private `yearbook-exports`.

### Security invariants

- Không đặt service-role key, worker secret, HMAC secret hoặc Turnstile secret trong biến `NEXT_PUBLIC_*`.
- RLS là lớp bảo vệ dữ liệu; dashboard layout, UI state hoặc Proxy không thay thế RLS/authorization trong mutation.
- Public event được query theo exact slug, chỉ nhận event `public`/`unlisted`, chưa deleted/archived và dùng projection giới hạn trường.
- Unlisted page tạo canonical URL nhưng đặt `robots.index=false` và `robots.follow=false`.
- Export, Director và invitation dùng token hash; raw token không được lưu hoặc log.
- Export job dùng immutable snapshot, idempotency key, lease/heartbeat/retry và artifact retention.
- Collaborator role matrix hiện là `owner`, `editor`, `moderator`, `viewer`; các capability được định nghĩa tập trung trong `features/collaboration/permissions.ts`.

## Edge Functions

| Function | Mục đích | Ghi chú runtime |
| --- | --- | --- |
| `submit-wish` | Guest submission atomic | `verify_jwt = false`, Turnstile, hash IP/device, transaction RPC |
| `create-upload-session` | Tạo signed upload session | Validate MIME, path, quota, event state; upload vào private bucket |
| `generate-ai-wish` | Tạo 3 gợi ý lời chúc | OpenAI `gpt-3.5-turbo`, static fallback; kiểm tra `event.allow_ai` |
| `cleanup-media` | Dọn media/poster assets | POST + `x-cleanup-secret`, batch 100, service-role cleanup RPC |

Shared helpers nằm trong `supabase/functions/_shared/` cho CAPTCHA, CORS, errors, logging, media validation và submission parsing.

## PDF export worker

`workers/pdf` là package độc lập, không dùng dependency Puppeteer từ root app.

- Poll `claim_export_job` theo lease ngắn.
- Tạo print token dùng một lần, gọi `/api/exports/print/[jobId]` và render bằng Puppeteer headless.
- Upload PDF vào `yearbook-exports/<owner_id>/<job_id>/...pdf`.
- Gọi `complete_export_job` hoặc `fail_export_job`, có heartbeat và bounded retry.
- Định kỳ gọi cleanup RPC, xóa object trước rồi mới finalize metadata.
- Chặn `--disable-web-security` trong `PDF_CHROMIUM_ARGS`.

Chạy worker:

```bash
cd workers/pdf
npm install
npm run typecheck
npm start
```

Worker bắt buộc có `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` và `PUBLIC_APP_URL`. Các biến `PDF_*` có default trong `workers/pdf/src/config.ts`.

## Biến môi trường

> Chỉ commit `.env.example` và `supabase/functions/.env.example`; không commit `.env.local`, secret hoặc token thật.

### Next.js

| Biến | Phạm vi | Mục đích |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | Browser/SSR client key hiện dùng |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public/compatibility | Legacy fallback trong env validation |
| `NEXT_PUBLIC_SITE_URL` | public/server | Canonical URL và auth callback |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | public | CAPTCHA widget |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | public | Cloudinary cover upload |
| `NEXT_PUBLIC_CLOUDINARY_API_KEY` | public | Cloudinary upload config |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | public | Upload preset |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only | Admin client/RPC boundary |
| `DATABASE_URL` | server-only, optional | Direct DB integrations nếu được bật |
| `TURNSTILE_SECRET_KEY` | server/Edge | Verify CAPTCHA |
| `TURNSTILE_EXPECTED_HOSTNAME` | server/Edge, optional | Kiểm tra hostname |
| `WISH_RATE_LIMIT_SALT` | server/Edge | Hash IP/device rate-limit identifiers |
| `REACTION_SECRET_KEY` | server-only | Sign guest reaction cookie, tối thiểu 32 ký tự |
| `REACTION_PREVIOUS_SECRET_KEY` | server-only, optional | Secret cũ trong thời gian rotate |
| `EXPORT_PRINT_TOKEN_SECRET` | server/worker | HMAC print token, tối thiểu 32 ký tự |
| `DIRECTOR_SESSION_SECRET` | server-only | HMAC Director session, tối thiểu 32 ký tự |

### Edge/AI

Supabase inject `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` cho function runtime. `generate-ai-wish` đọc `OPENAI_API_KEY`; `submit-wish` có thể đọc `CAPTCHA_BYPASS_TOKEN` trong môi trường test; `cleanup-media` cần `CLEANUP_MEDIA_CRON_SECRET` tương ứng với header `x-cleanup-secret`.

### PDF worker

```dotenv
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only-secret>
PUBLIC_APP_URL=https://<memoria-host>
PDF_WORKER_ID=pdf-worker-1
PDF_LEASE_SECONDS=120
PDF_POLL_INTERVAL_MS=5000
PDF_CLEANUP_INTERVAL_MS=900000
PDF_ARTIFACT_RETENTION_HOURS=24
PDF_CLEANUP_BATCH_SIZE=100
PDF_NAVIGATION_TIMEOUT_MS=120000
PDF_PRINT_TOKEN_TTL_MS=900000
```

## Local development

### Yêu cầu

- Node.js `>= 22.0.0`.
- npm và Docker Desktop nếu cần chạy local Supabase.
- Supabase CLI theo version package lock (`2.110.0`).

### Khởi động app

```bash
npm install
Copy-Item .env.example .env.local       # PowerShell
# cp .env.example .env.local             # macOS/Linux
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

### Khởi động local Supabase

Local config dùng các port sau:

| Service | Port |
| --- | ---: |
| Supabase API | `44321` |
| PostgreSQL | `44322` |
| Studio | `44323` |
| Inbucket/local SMTP | `44324` |

```bash
npm run supabase:start
npx supabase status -o env
npm run supabase:reset
npm run supabase:types
```

Dừng stack:

```bash
npm run supabase:stop
```

`supabase:reset` áp dụng toàn bộ migration rồi chạy `supabase/seed.sql`. Ở checkout hiện tại, migration `20260805020602_harden_public_function_grants.sql` còn tham chiếu `public.rls_auto_enable()` nhưng không có migration định nghĩa function này; vì vậy local reset chưa được xem là release gate xanh cho tới khi baseline được sửa hoặc database test environment cung cấp helper đó.

### Thêm migration

```bash
npx supabase migration new descriptive_change_name
# chỉnh file migration
npm run supabase:reset
npm run supabase:types
npx supabase db push
```

Luôn review grant, RLS, view security, `SECURITY DEFINER`, `search_path` và remote migration history trước khi push. Không sửa schema production trực tiếp ngoài migration workflow.

## Kiểm tra và validation

### Các lệnh hiện có

```bash
npm run typecheck
npm run lint
npm run build
npm run start
```

`npm run test:unit` hiện chạy lệnh placeholder `No tests specified`; package không còn Vitest/Playwright dependency thực thi. Các SQL test ở `supabase/tests/database/` là 8 pgTAP contract/security files, nhưng repository chưa có root `test:db` script và cần một PostgreSQL/Supabase environment có pgTAP.

### Kết quả scan hiện tại

- TypeScript strict check: **Pass**.
- ESLint: **Pass với 0 error và 5 warning** ở các component hiện hữu (`WelcomeSplashModal`, `cloudinary-cover-upload`, `StickerInteractionManager`, `public-wall-demo`, `WishComposer`).
- Database/RLS/pgTAP: **chưa xác nhận trong checkout này**; local reset bị baseline helper drift ở trên.
- Browser/E2E: **chưa có suite hiện hành**, chưa xác nhận owner/non-owner, public/unlisted, upload, Realtime, Director và PDF end-to-end.
- Production build: phải chạy lại ở môi trường có thể tải Google Geist/Geist Mono; build có thể bị ảnh hưởng nếu network font provider bị chặn.

Trước release nên chạy tối thiểu: migration reset trên database disposable, pgTAP, RLS/grant negative cases, authenticated browser smoke, Edge Function tests, PDF worker lease/retry/retention checks, `npm run typecheck`, `npm run lint`, `npm run build` và `git diff --check`.

## Known limitations và việc cần tiếp tục

- Public wish wall đang bị ẩn để tránh lộ thông tin người gửi; cần quyết định lại public privacy contract trước khi bật.
- `generate-ai-wish` dùng `Map` trong memory cho giới hạn 5 request/phút/IP; cách này không bảo đảm limiter phân tán khi chạy nhiều Edge instance.
- Account deletion hiện tạo cooling-off request 30 ngày; worker/transaction purge được review riêng, UI không tự hard-delete dữ liệu.
- PDF worker cần cài dependency và chạy ở process/server riêng; root `npm install` không cài Puppeteer cho worker.
- Static check không chứng minh được remote Supabase grants, RLS, CAPTCHA provider, Cloudinary, OpenAI, Realtime hoặc Vercel env đang đúng.
- Một số file UI còn ESLint warnings và một số tài liệu release gate phản ánh các pass cũ; phải đối chiếu lại current HEAD trước khi đánh dấu production Done.

## Tài liệu nội bộ

- [Technical Blueprint](docs/graduation-message-technical-blueprint-v2.md) — blueprint hệ thống và các phase sản phẩm.
- [MVP Architecture Decisions](docs/architecture/graduation-message-mvp-decisions.md) — access matrix, public projection, storage, reactions, retention và PDF boundary.
- [Cloudinary Media Contract](docs/contracts/cloudinary-media-contract.md) — ranh giới cover upload và Poster Studio assets.
- [Security Checklist](docs/security/checklist.md) — checklist staging Supabase/Next.js.
- [Deployment Guide](docs/operations/deployment.md) — hạ tầng và quy trình deploy tham khảo.
- [Export Jobs Operations](docs/operations/export-jobs.md) — queue, worker, retention và private artifact.
- [Restore Runbook](docs/operations/restore.md) — database backup/restore drill.
- [RM26 release gates](docs/rm26-p0-release-gate.md) và `docs/operations/` — các gate remediation, cần đọc cùng trạng thái runtime hiện tại.

## Quy ước bảo trì

- Giữ migration forward-only và generated types đồng bộ với schema.
- Đặt validation/schema/contract gần feature; dùng server-only boundary cho secret và service-role client.
- Khi thay đổi route hoặc public projection, cập nhật metadata, privacy behavior, RLS/grant và release gate liên quan.
- Không coi trạng thái Done lịch sử, static build hoặc README cũ là bằng chứng runtime hiện tại.
- Trước khi commit, kiểm tra `git status`, giữ nguyên thay đổi của người khác, chạy validation phù hợp và ghi rõ gate còn thiếu.
