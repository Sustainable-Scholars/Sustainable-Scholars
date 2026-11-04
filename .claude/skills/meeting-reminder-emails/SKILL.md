---
name: meeting-reminder-emails
description: Sustainable Scholars meeting reminder system, built on Supabase (not Activepieces). Emails clients 24 hours, 1 hour and 5 minutes before a call booked on sustainable-scholars.org. Covers the design, the tables, the two edge functions, the safety rules, how to go live, and how to test and troubleshoot. Use when changing, turning on, testing or debugging meeting reminders, or when asked to cut no-shows.
---

# Meeting reminder emails (Supabase)

Built 2026-11-04 in the Supabase project "Scholarship Database" (`jbqzuzuloxxnzjrbehgr`).
State at build: tables, functions and rules deployed and tested in **dry-run mode**. Not live.
Code lives in this repo: `supabase/migrations/20261104_meeting_reminders_schema.sql`,
`supabase/functions/mr-sync/index.ts`, `supabase/functions/mr-send/index.ts`.

## Where bookings come from
The site's "Book a Call" button goes to `/book-call`, a custom page in the Base44 app
(app id `69d8c767f023bd93d843becd`). Each booking is a Base44 `Booking` record: `user_email`,
`user_name`, `start_time`, `end_time`, `status` (confirmed/cancelled/completed), `google_meet_link`,
`title`. Calls are 15-minute Google Meet sessions, booked about 3 to 6 days ahead, a few per week.

## How it works
1. **`mr-sync`** (every 5 minutes) reads upcoming `Booking` records from Base44 and writes `mr_meetings`
   plus three `mr_reminders` rows (24h, 1h, 5m). A reschedule recalculates unsent due times. A cancel
   cancels unsent reminders. Any Base44 error returns HTTP 502 and is logged, so a failure is never silent.
2. **`mr-send`** (every minute) calls `mr_claim_due()`, which expires, cancels and locks rows, then emails
   each claimed reminder and marks it sent. A failure retries up to 3 times, then marks it failed and emails the owner.
3. **Handshake:** the cron jobs send an `x-cron-secret` header. The value is `mr_settings.cron_secret`
   (random, stored in the database). The functions compare it to that same row. No secret goes through chat.

## Tables (all service-role only)
`mr_settings` (one row: enabled, mode, owner_email, from_email, from_name, display_tz, cron_secret),
`mr_meetings`, `mr_reminders` (unique per meeting and kind), `mr_opt_outs`, `mr_run_log`.

## Safety rules (all tested)
- One reminder of each kind per meeting, enforced by a unique constraint.
- A reminder past its window is dropped, never sent late: 24h gets 15 minutes, 1h gets 10, 5m gets 2.
- A meeting booked too close to start skips the reminders that no longer fit.
- Cancelled, completed and past meetings get nothing.
- Opted-out emails get nothing. Add the address to `mr_opt_outs` when someone replies STOP.
- The 24h reminder is kept between 7 AM and 8 PM Eastern; 1h and 5m follow the meeting time.
- `enabled` is the kill switch. `mode`: `dry` (log only), `test` (email only the owner), `live`.
- Row locking (`for update skip locked`) and an idempotency key on the email prevent double sends.

## Going live: still to do
| Item | Who | Notes |
|---|---|---|
| `BASE44_API_KEY` secret | Owner, in Supabase > Edge Functions > Secrets | Holds a Base44 **personal access token** (workspace name > Settings > Secrets > Personal access tokens; one app, read-only; created by the admin who owns the app so row-level security lets it read all bookings). `mr-sync` calls `GET /api/apps/{app_id}/entities/Booking/v2/list` with `Authorization: Bearer`, per Base44 docs read 2026-11-04. Untested against a live token: the response shape is parsed tolerantly and logged on mismatch. The token stops working if its creator leaves the workspace. |
| Email provider | Owner | Code uses Resend (`RESEND_API_KEY` secret). Needs `sustainable-scholars.org` (or a subdomain) verified with DNS records. Alternative: Microsoft Graph from info@ (needs an Entra app and admin consent) means rewriting `sendMail`. |
| Schedule cron | Claude | `pg_cron` + `pg_net`: `mr-sync` every 5 minutes, `mr-send` every minute, header `x-cron-secret` from `mr_settings`. |
| Test mode week | Both | `mode = 'test'`: every reminder goes to the owner only. Then `mode = 'live'`. |
| Time zone | Owner | Bookings carry no time zone, so emails show Eastern (`display_tz`). Confirm this fits clients. |

## Open items (as of build)
- The dry-run test rows (`source_id` starting `TEST-`) still need deleting, and `mr_settings` was left at
  `enabled = true, mode = 'dry'`. Set `enabled = false` until cron is scheduled. The cleanup SQL was
  blocked by a connector confirmation prompt.
- No daily accountability report yet. Planned: an 8 AM email listing meetings with fewer than 3 reminders, failures, and replies waiting.
- A "cron stopped running" alert is not built.

## Testing and troubleshooting
- Test without Base44: insert a row in `mr_meetings` and `mr_reminders`, set `enabled = true, mode = 'dry'`,
  call `mr-send` with `net.http_post` and the `x-cron-secret` header, then read `mr_reminders` and `mr_run_log`.
  Run on 2026-11-04: due reminder sent (dry), cancelled and opted-out rows left unsent, 20-minute-late row dropped.
- `mr_run_log` holds every sync and send result. `status = 'failed'` rows carry the error text.
- A client who got only some reminders usually booked late; check `error = 'booked too late for this reminder'`.
