---
name: meeting-reminder-emails
description: Blueprint for an Activepieces workflow that emails clients reminders before calendar invites so fewer meetings are missed. Covers the reminder schedule, the data tables, the flow steps, and the built-in limits (no duplicates, quiet hours, a cap per event, an on/off switch, failure alerts, a daily accountability report). Use when building, extending or debugging meeting reminders, or when asked to cut no-shows.
---

# Meeting reminder emails (Activepieces blueprint)

Status: design only, not built yet. Written 2026-11-01 for Sustainable Scholars. It reuses the
pattern of the Instagram automation: one scheduled flow, data in tables, new meetings need no new flow.

## Goal and success measure
Fewer missed meetings caused by not knowing about them. Track one number: **no-show rate**
= meetings where the client did not join / meetings held, per week. Compare 4 weeks before and after launch.

## Decisions to confirm before building (defaults in bold)
| Question | Default |
|---|---|
| Which calendar holds the client meetings? | **Outlook (Microsoft 365)**, since the daily Instagram digest already sends through it. Google Calendar works the same way with its piece. |
| Which meetings get reminders? | **Only events with the category/label `Client` or the text `[remind]` in the title**, so internal events never email anyone. |
| Who sends? | **info@sustainable-scholars.org** through the existing Outlook connection. |
| Time zone shown to clients | **The event's own time zone, printed with its abbreviation (e.g. 3:00 PM ET)**. |

## Reminder schedule (per meeting)
| # | When | Purpose | Skipped if |
|---|---|---|---|
| 1 | **On booking** (within 15 minutes of creation) | Confirm date, time, link, how to reschedule | Meeting starts in under 24 hours |
| 2 | **48 hours before** | Awareness | Meeting starts in under 48 hours |
| 3 | **24 hours before** | Awareness plus "reply YES to confirm" | Client already confirmed |
| 4 | **2 hours before** | Last nudge with the join link | Meeting starts in under 2 hours |

Rule: a client never gets more than **4 reminder emails per meeting** and never more than
**2 emails in any 24 hours**. If two reminders land in the same window, send only the later one.

## Boundaries that give accountability and consistency
1. **Ledger, not memory.** Every email attempt is one row in `Reminder Log`. A reminder is sent only if no row exists for that event + reminder number. This makes the flow safe to run every 15 minutes and safe to re-run.
2. **Quiet hours.** Nothing sends between 8 PM and 7 AM in the client's time zone. A reminder due in that window goes out at 7 AM, unless the meeting starts before then, in which case it is dropped and logged as `Skipped: quiet hours`.
3. **Hard caps.** 4 per meeting, 2 per client per 24 hours, 40 emails per run, 200 per day. Hitting a cap stops sending and raises an alert; it never silently drops.
4. **Only real, current meetings.** Skip events that are cancelled, declined by the client, in the past, or have no client email. Re-read the event right before sending, so a rescheduled meeting uses the new time.
5. **Reschedule handling.** If the start time changed since the last reminder, reset that meeting's reminder numbers 2 to 4 and log `Rescheduled`.
6. **Opt-out.** A client with `Opted Out` set gets no reminders. Every email has a plain-text line: "Reply STOP to skip reminders." A person sets the flag when someone replies.
7. **Kill switch.** One row in `Settings` (`Reminders Enabled` = Yes/No). The flow reads it first and exits when it is No. Pause everything in one edit.
8. **One owner.** `Settings` holds `Owner Email`. Failures and cap alerts go there, not to a shared inbox nobody reads.
9. **Fail loudly.** Mirror the Instagram fix: if the calendar read fails, throw, so the run shows as Failed. A Succeeded run must mean the check really happened.
10. **Dry-run mode.** `Mode` = Test sends every email to `Owner Email` only, with the client's name in the subject. Live mode is a deliberate switch.

## Data (Activepieces Tables)
**Settings** (one row): Reminders Enabled, Mode (Test/Live), Owner Email, Quiet Start (20), Quiet End (7), Max Per Meeting (4), Max Per Client Per 24h (2), Max Per Run (40), Max Per Day (200).

**Clients**: Email, Name, Time Zone (default America/New_York), Opted Out (Yes/blank), Notes.

**Reminder Log** (the audit trail): Event ID, Reminder No, Client Email, Meeting Start (UTC), Sent At, Result (Sent / Failed / Skipped), Reason, Confirmed (Yes/blank).

**Daily Report** is not a table; it is an email (below).

## Flow 1: "Meeting reminders (master)", every 15 minutes
1. **Settings** (Tables, find records). Exit if `Reminders Enabled` is not Yes.
2. **Get events** (Outlook calendar, list events from now to now + 50 hours, filter to `Client`).
3. **Get log** (Tables, find records for those event IDs) and **Get clients** (opt-outs, time zones).
4. **CODE "Find due reminders"** (inputs: settings, events, log, clients). For each event, work out which reminder numbers are due now, then apply the limits above in this order: eligibility, opt-out, already sent, reschedule reset, quiet hours, per-meeting cap, per-client cap, per-run and per-day caps. Return `{ due: [...], skipped: [...], errors: [] }`. Throw if the calendar read failed.
5. **Loop over `due`**: send the email (Outlook, continue-on-failure). On success write a `Sent` row. On failure write a `Failed` row with the error.
6. **Loop over `skipped`**: write one `Skipped` row with the reason (once per event + reminder, so the log stays small).

Pseudo-code for step 4:
```js
export const code = async (inputs) => {
  const OFFSETS = { 1: null, 2: 48, 3: 24, 4: 2 };       // hours before start; 1 = on booking
  const now = Date.now();
  const due = [], skipped = [];
  for (const ev of inputs.events) {
    if (ev.isCancelled || !ev.clientEmail || Date.parse(ev.start) <= now) continue;
    // 1. opt-out  2. already in log  3. start changed -> reset  4. quiet hours in client tz
    // 5. caps (per meeting, per client per 24h, per run, per day)
    // push to due[] with { eventId, reminderNo, to, subject, html }, else skipped[] with a reason
  }
  return { due, skipped };
};
```

## Flow 2: "Reminder accountability report", every day 8 AM Eastern
Reads the last 24 hours of `Reminder Log` and the calendar, and emails `Owner Email`:
- Meetings held yesterday vs. reminders sent for them (any meeting with 0 reminders sent is listed by name).
- Failures and skips with reasons.
- Any cap that was hit.
- Replies awaiting a person (confirmations, STOP requests, reschedule asks).
Send it even when everything is fine ("0 problems"). A missing report means the flow itself is broken.

## Email templates (plain, one action each)
Subject: `Reminder: {{meeting title}} on {{day}}, {{time with zone}}`
Body: greeting by first name; date and time with zone; join link or address; one line on what to bring;
a reschedule link or reply instruction; opt-out line. Reminder 3 adds "Reply YES to confirm."
Reminder 4 is two lines: the time and the join link. Run the text through the `humanizer` skill before going live.

## Build order
1. Create the three tables and the `Settings` row in **Test** mode.
2. Build Flow 1 with the CODE step; test with a fake `Client` event on a calendar 3 hours out.
3. Check each rule on purpose: cancel the event, reschedule it, mark the client opted out, set quiet hours across the send time, hit the per-run cap with ten fake events.
4. Build Flow 2 and confirm the report arrives with zero real clients.
5. Switch `Mode` to Live for one week with a small group; compare no-shows.
6. Review the daily reports for a week, then roll out to all client meetings.

## Limits and costs
- Activepieces free plan: an idle run is about 5 steps; at 15-minute intervals that is roughly 14,000 steps a month. If that is tight, run every 30 minutes.
- Outlook sending limits apply (about 30 messages per minute); the per-run cap keeps this safe.
- Replies (YES, STOP) are handled by a person at first. Auto-handling them is a later step.

## Notes
- Send from a real, monitored address so clients can reply.
- Keep the schedule short. Four emails is the ceiling; more trains clients to ignore them.
- Never email anyone who is not on a calendar event the team created.
