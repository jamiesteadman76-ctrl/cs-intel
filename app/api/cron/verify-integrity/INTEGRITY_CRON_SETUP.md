# Integrity Cron Setup

The new endpoint `app/api/cron/verify-integrity/route.ts` runs the database integrity check (`verify_leaderboard_integrity()`) on a schedule and writes a `system_alerts` row when drift is detected.

## Required environment variables

Add these to **both**:

1. `.env.local` (for local testing)
2. Vercel project → Settings → Environment Variables (for production)

| Variable | Notes |
|---|---|
| `CRON_SECRET` | Any long random string. Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` on every invocation. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service-role key. **NEVER** prefix with `NEXT_PUBLIC_` — that would leak it into the browser bundle. |
| `NEXT_PUBLIC_SUPABASE_URL` | Already present. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Already present. |

## `vercel.json` schedule

A `vercel.json` was added to the project root with the entry:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    { "path": "/api/cron/verify-integrity", "schedule": "0 */6 * * *" }
  ]
}
```

This triggers the route every 6 hours on the hour. Adjust `0 */6 * * *` if you want a different cadence:

| Schedule | Cron expression |
|---|---|
| Every hour | `0 * * * *` |
| Every 6 hours | `0 */6 * * *` |
| Every 12 hours | `0 */12 * * *` |
| Daily at 03:00 UTC | `0 3 * * *` |

## Manual invocations

For an on-demand check from the terminal (uses the same Bearer-token auth):

```bash
curl -i -H "Authorization: Bearer $CRON_SECRET" \
     https://<your-deployment>/api/cron/verify-integrity
```

## What it does

1. Authorization gate via `Authorization` header against `CRON_SECRET`.
2. Builds the service-role Supabase client (`createSupabaseAdmin()`).
3. Calls `verify_leaderboard_integrity()` RPC.
4. If the result has any rows, INSERTs a row into `public.system_alerts`:
   ```jsonc
   {
     "severity": "critical",
     "message": "Leaderboard integrity violation: <N> user(s) drifted; top user '<name>' mismatch=<value>",
     "resolved": false
   }
   ```
5. Returns JSON describing the run, e.g.:
   ```jsonc
   {
     "success": true,
     "checked_at": "2026-07-02T08:00:00.000Z",
     "mismatch_count": 0,
     "alerts_inserted": 0,
     "sample": []
   }
   ```
