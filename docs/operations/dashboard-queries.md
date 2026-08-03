# Operational Metrics & Dashboard Queries

This document contains sample LogQL (for Grafana/Loki) or equivalent queries to monitor critical flows based on the structured logs emitted by the application.

## 1. Submission Success Rate & Latency
**Query: Submission count by result code**
```logql
sum by (resultCode) (rate({surface="action", action="submit-wish"}[5m]))
```

**Query: Submission P95 Latency**
```logql
histogram_quantile(0.95, sum(rate({surface="action", action="submit-wish"}_durationMs_bucket[5m])) by (le))
```

## 2. AI Suggestions Usage & Errors
**Query: Generate AI Wish Function Errors (Timeout/Failures)**
```logql
sum by (resultCode) (rate({surface="function", function="generate-ai-wish", level="error"}[5m]))
```

**Query: Fallback usage rate (when AI fails)**
```logql
sum by (isFallback) (rate({surface="action", action="ai-suggest"}[5m]))
```

## 3. Reaction Abuse / Rate Limits
**Query: Rate limit hits for reactions**
```logql
sum(rate({surface="route", route="/api/reactions", resultCode="429"}[5m]))
```

## 4. Realtime Reconnects & Quota
**Query: Realtime reconnect spikes (Requires Supabase Platform Logs)**
```sql
select
  timestamp,
  event_message
from
  postgres_logs
where
  event_message like '%realtime reconnect%'
order by
  timestamp desc;
```

**Query: Storage Bytes Uploaded**
```sql
select
  sum(metadata->>'size') as total_bytes
from
  storage.objects
where
  created_at >= now() - interval '1 hour';
```

## Abuse Thresholds (Initial Config)

- **Submission Rate Limit**: 5 wishes / minute per IP.
- **Reaction Rate Limit**: 10 reactions / minute per IP/Session.
- **AI Token Usage**: Timeout bounded to 8s, max 3 suggestions.
- **Media Upload**: 5MB per file, rate limited via submission transaction.

*Adjust these thresholds in environment variables (e.g., `RATE_LIMIT_SUBMISSION`, `RATE_LIMIT_REACTION`) based on actual load testing.*
