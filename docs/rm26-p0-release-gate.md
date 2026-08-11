# RM26 Phase 0 Release Gate

Ngày đối soát: 2026-08-11
Repository: D:/Graduation
Branch: main

## Kết quả hiện tại

T01 vẫn Done theo live Notion. T02, T03, T04 và T05 vẫn In progress vì còn acceptance/runtime evidence chưa đủ. T06 giữ In progress và không được đóng khi các dependency hoặc release gate còn thiếu.

## Gate đã chạy

- npm run test:unit: PASS, 8/8 tests. Script dùng Node test isolation=none để tránh Windows spawn EPERM.
- npm run typecheck: PASS.
- npm run lint: PASS, 0 errors; còn 5 warnings không thuộc thay đổi RM26.
- git diff --check trên file RM26: PASS.
- npm run build: BLOCKED bởi next/font không tải được Geist/Geist Mono từ fonts.googleapis.com trong môi trường hiện tại.
- git diff --check toàn worktree: BLOCKED bởi trailing whitespace có sẵn tại src/components/landing/event-journey.tsx:126; thay đổi landing hiện hữu được giữ nguyên.

## Supabase T03/T04

Remote project đã nhận hai migration forward-only qua Supabase migration tool:

- T03: harden_reaction_command_and_rate_limits.
- T04: close_unlisted_data_api_enumeration.

Read-only verification remote:

- private.reaction_rate_limits tồn tại và có RLS.
- Hai RPC tồn tại, đều SECURITY DEFINER, search_path rỗng và chỉ service_role có EXECUTE trong role grants.
- public_wishes_view không còn grants cho PUBLIC/anon/authenticated.
- events, wishes và wish_media không còn table grants cho anon.
- private.trg_wishes_realtime_event tồn tại, SECURITY DEFINER và search_path rỗng.

Advisors vẫn có các notice/warning có sẵn hoặc expected boundary, gồm RLS enabled without policy cho private.reaction_rate_limits và cảnh báo cũ trên các function khác. Không có claim rằng toàn bộ project advisor output đã sạch.

## Runtime limitations

- pgTAP local chưa thể chạy trên schema hoàn chỉnh: supabase db reset --local dừng ở migration baseline 20260805020602_harden_public_function_grants.sql vì gọi public.rls_auto_enable() không tồn tại trong chuỗi migration hiện tại.
- pgTAP linked remote chưa chạy vì project không có function plan() của pgTAP.
- Chưa có concurrent toggle, multi-instance limiter, owner/RLS action test, REST negative test hoặc browser/E2E smoke trong checkout hiện tại.
- Không tạo commit/PR trong vòng này.

## Follow-up required before Done

- Sửa baseline migration drift hoặc cung cấp database test environment có đầy đủ migration và pgTAP.
- Bổ sung/chạy route, REST, owner/RLS và concurrent/multi-instance tests.
- Chạy lại build khi môi trường cho phép tải font hoặc dùng asset font đã được phê duyệt.
- Re-fetch từng task Notion và chỉ chuyển Done khi mọi acceptance criterion có evidence trực tiếp.