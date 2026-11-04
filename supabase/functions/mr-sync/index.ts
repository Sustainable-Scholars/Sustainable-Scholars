import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Reads upcoming bookings from the Base44 site and keeps mr_meetings / mr_reminders in step:
// new booking -> 3 reminder rows; reschedule -> due times recalculated; cancel -> reminders cancelled.

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const APP_ID = Deno.env.get("BASE44_APP_ID") ?? "69d8c767f023bd93d843becd";
const API_KEY = Deno.env.get("BASE44_API_KEY");

const OFFSET_MIN: Record<string, number> = { "24h": 1440, "1h": 60, "5m": 5 };
const WINDOW_MIN: Record<string, number> = { "24h": 15, "1h": 10, "5m": 2 };

function localParts(d: Date, tz: string) {
  const f = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "numeric", hour12: false, timeZone: tz });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  return { h: Number(p.hour) % 24, m: Number(p.minute) };
}

// The 24h reminder is the only one that can land overnight; keep it between 7 AM and 8 PM local.
function dueAt(kind: string, start: Date, tz: string): Date {
  let due = new Date(start.getTime() - OFFSET_MIN[kind] * 60000);
  if (kind === "24h") {
    const { h, m } = localParts(due, tz);
    if (h < 7) due = new Date(due.getTime() + ((7 - h) * 60 - m) * 60000);
    else if (h >= 21) due = new Date(due.getTime() - ((h - 20) * 60 + m) * 60000);
  }
  return due;
}

Deno.serve(async (req) => {
  const { data: s } = await db.from("mr_settings").select("*").eq("id", 1).single();
  if (!s || req.headers.get("x-cron-secret") !== s.cron_secret) return new Response("forbidden", { status: 403 });

  if (!API_KEY) {
    await db.from("mr_run_log").insert({ job: "sync", detail: { error: "BASE44_API_KEY is not set" } });
    return new Response(JSON.stringify({ error: "BASE44_API_KEY is not set" }), { status: 500 });
  }

  const now = new Date();
  const q = encodeURIComponent(JSON.stringify({ start_time: { $gt: new Date(now.getTime() - 3600000).toISOString() } }));
  const res = await fetch(`https://app.base44.com/api/apps/${APP_ID}/entities/Booking?q=${q}&limit=500`, {
    headers: { api_key: API_KEY, "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const detail = { error: `Base44 HTTP ${res.status}`, body: (await res.text()).slice(0, 300) };
    await db.from("mr_run_log").insert({ job: "sync", detail });
    return new Response(JSON.stringify(detail), { status: 502 }); // fail loudly: a green run must mean a real check
  }
  const bookings: any[] = await res.json();

  let created = 0, updated = 0, cancelled = 0;
  for (const b of bookings) {
    if (!b.id || !b.start_time || !b.user_email) continue;
    const start = new Date(b.start_time);
    const status = b.status === "cancelled" ? "cancelled" : b.status === "completed" ? "completed" : "confirmed";

    const { data: existing } = await db.from("mr_meetings").select("id,start_utc,status").eq("source_id", b.id).maybeSingle();
    const row = {
      source_id: b.id, client_email: String(b.user_email).trim(), client_name: b.user_name ?? null,
      start_utc: start.toISOString(), end_utc: b.end_time ? new Date(b.end_time).toISOString() : null,
      meet_link: b.google_meet_link ?? null, topic: b.title ?? null, status, updated_at: now.toISOString(),
    };
    const { data: m, error } = await db.from("mr_meetings").upsert(row, { onConflict: "source_id" }).select("id").single();
    if (error || !m) { await db.from("mr_run_log").insert({ job: "sync", detail: { error: error?.message, booking: b.id } }); continue; }

    const startChanged = existing && new Date(existing.start_utc).getTime() !== start.getTime();
    if (!existing) created++; else if (startChanged || existing.status !== status) updated++;
    if (status === "cancelled" && existing?.status !== "cancelled") cancelled++;

    const { data: rems } = await db.from("mr_reminders").select("id,kind,due_at,status").eq("meeting_id", m.id);
    const byKind = new Map((rems ?? []).map((r: any) => [r.kind, r]));

    for (const kind of Object.keys(OFFSET_MIN)) {
      const due = dueAt(kind, start, s.display_tz);
      const late = due.getTime() < now.getTime() - WINDOW_MIN[kind] * 60000;
      const want = status !== "confirmed" ? "cancelled" : late ? "skipped" : "pending";
      const err = want === "skipped" ? "booked too late for this reminder" : null;
      const cur: any = byKind.get(kind);

      if (!cur) {
        await db.from("mr_reminders").insert({ meeting_id: m.id, kind, due_at: due.toISOString(), status: want, error: err });
      } else if (cur.status === "sent" || cur.status === "sending") {
        if (startChanged) await db.from("mr_run_log").insert({ job: "sync", detail: { note: "rescheduled after a reminder was sent", meeting: m.id, kind } });
      } else if (status !== "confirmed") {
        if (cur.status !== "cancelled") await db.from("mr_reminders").update({ status: "cancelled", updated_at: now.toISOString() }).eq("id", cur.id);
      } else if (startChanged || new Date(cur.due_at).getTime() !== due.getTime()) {
        await db.from("mr_reminders").update({ due_at: due.toISOString(), status: want, error: err, attempts: 0, updated_at: now.toISOString() }).eq("id", cur.id);
      }
    }
  }

  const detail = { seen: bookings.length, created, updated, cancelled };
  await db.from("mr_run_log").insert({ job: "sync", detail });
  return new Response(JSON.stringify(detail), { headers: { "Content-Type": "application/json" } });
});
