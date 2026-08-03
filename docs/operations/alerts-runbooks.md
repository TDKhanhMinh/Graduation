# Alerts & Runbooks

## Alert: High Submission Error Rate (Spike)
**Condition:** `sum by(resultCode) (rate({surface="action", action="submit-wish", level="error"}[5m])) > 10`
**Description:** There is a spike in errors during the wish submission process.
**Runbook Actions:**
1. Check the error codes (`resultCode`). If `429` (Rate Limited), investigate if it's a volumetric attack from a specific subnet (use hashed IP from rate limiter logs).
2. If `5xx` (Internal Error), check the Supabase Postgres logs for transaction rollbacks or foreign key violations.
3. Verify if the object storage bucket `media` is running out of quota or permissions changed.
4. Escalate to the backend on-call if the issue persists.

## Alert: AI Function High 5xx Rate / Timeouts
**Condition:** `sum(rate({surface="function", function="generate-ai-wish", level="error"}[5m])) > 5`
**Description:** The Edge Function `generate-ai-wish` is failing or timing out.
**Runbook Actions:**
1. Check OpenAI API status (https://status.openai.com).
2. If OpenAI is degraded, the fallback logic will automatically handle generating generic wishes (ensure `fallbackUsed` is logging).
3. If it's a Supabase Edge Function cold start issue, consider keeping the function warm during peak traffic hours.
4. Verify `OPENAI_API_KEY` is not expired or revoked.

## Alert: Realtime Disconnections Spike
**Condition:** High volume of `realtime reconnect` in Postgres/Supabase logs.
**Description:** Clients are dropping and reconnecting to the Realtime wall frequently.
**Runbook Actions:**
1. Check Supabase Realtime service status.
2. Verify if the total concurrent connections exceed the Supabase project plan limits (e.g., 500 concurrent).
3. If exceeding limits, consider temporarily disabling Realtime on the client (falling back to SWR polling) or upgrading the plan.

## Alert: Storage Quota Approaching
**Condition:** `total_bytes` in `media` bucket > 80% of project limit.
**Description:** The storage is filling up rapidly.
**Runbook Actions:**
1. Ensure the `cleanup-media` cron job is running successfully (`cleanup-media` edge function).
2. Manually trigger a cleanup of unlinked media if the cron failed.
3. Check for abuse (users bypassing the frontend to upload large media). Ensure bucket RLS prevents direct arbitrary uploads.
