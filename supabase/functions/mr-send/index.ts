import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Runs every minute. Claims due reminders (row-locked, so no double sends) and emails them.
// mode: dry = log only, test = send only to the owner, live = send to the client.

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
const MAX_ATTEMPTS = 3;
const SITE = "https://sustainable-scholars.org";

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

function compose(r: any, tz: string) {
  const start = new Date(r.o_start);
  const day = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: tz }).format(start);
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short", timeZone: tz }).format(start);
  const first = (r.o_name ?? "").trim().split(/\s+/)[0] || "there";
  const topic = r.o_topic || "Scholarship Strategy Session";
  const link = r.o_link ? `Join here: ${r.o_link}` : "Your Google Meet link is in your booking confirmation.";
  const lead: Record<string, [string, string]> = {
    "24h": [`Tomorrow: your Sustainable Scholars call, ${time}`, `Your call is coming up tomorrow.`],
    "1h": [`In 1 hour: your Sustainable Scholars call`, `Your call starts in 1 hour.`],
    "5m": [`Starting in 5 minutes: join your call`, `Your call starts in 5 minutes.`],
  };
  const [subject, line] = lead[r.o_kind];
  const text = `Hi ${first},\n\n${line}\n\n${topic}\n${day} at ${time}\n${link}\n\nNeed a different time? Reply to this email or book again at ${SITE}/book-call.\n\nReply STOP to skip reminders.\n\nSustainable Scholars`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5"><p>Hi ${esc(first)},</p><p>${line}</p><p><strong>${esc(topic)}</strong><br>${esc(day)} at ${esc(time)}</p>${r.o_link ? `<p><a href="${esc(r.o_link)}">Join your Google Meet call</a></p>` : `<p>${link}</p>`}<p>Need a different time? Reply to this email or book again at <a href="${SITE}/book-call">${SITE}/book-call</a>.</p><p style="color:#666;font-size:13px">Reply STOP to skip reminders.</p><p>Sustainable Scholars</p></div>`;
  return { subject, text, html };
}

async function sendMail(s: any, to: string, subject: string, text: string, html: string, key: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json", "Idempotency-Key": key },
    body: JSON.stringify({ from: `${s.from_name} <${s.from_email}>`, to: [to], reply_to: s.from_email, subject, text, html }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Resend ${res.status}: ${JSON.stringify(body).slice(0, 200)}`);
  return String(body.id ?? "");
}

Deno.serve(async (req) => {
  const { data: s } = await db.from("mr_settings").select("*").eq("id", 1).single();
  if (!s || req.headers.get("x-cron-secret") !== s.cron_secret) return new Response("forbidden", { status: 403 });
  if (!s.enabled) return new Response(JSON.stringify({ skipped: "reminders disabled" }));

  const { data: rows, error } = await db.rpc("mr_claim_due", { p_limit: 20 });
  if (error) {
    await db.from("mr_run_log").insert({ job: "send", detail: { error: error.message } });
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const out = { claimed: rows?.length ?? 0, sent: 0, failed: 0, dry: 0 };
  for (const r of rows ?? []) {
    try {
      const mail = compose(r, s.display_tz);
      let providerId = "dry-run";
      if (s.mode !== "dry") {
        if (!RESEND_KEY) throw new Error("RESEND_API_KEY is not set");
        const to = s.mode === "test" ? s.owner_email : r.o_email;
        const subject = s.mode === "test" ? `[TEST for ${r.o_email}] ${mail.subject}` : mail.subject;
        providerId = await sendMail(s, to, subject, mail.text, mail.html, r.o_id);
      } else out.dry++;
      await db.from("mr_reminders").update({ status: "sent", sent_at: new Date().toISOString(), provider_id: providerId, error: null, updated_at: new Date().toISOString() }).eq("id", r.o_id);
      out.sent++;
    } catch (e) {
      out.failed++;
      const msg = e instanceof Error ? e.message : String(e);
      const giveUp = r.o_attempts >= MAX_ATTEMPTS;
      await db.from("mr_reminders").update({ status: giveUp ? "failed" : "pending", error: msg, updated_at: new Date().toISOString() }).eq("id", r.o_id);
      if (giveUp && RESEND_KEY && s.mode !== "dry") {
        try { await sendMail(s, s.owner_email, `Reminder FAILED for ${r.o_email} (${r.o_kind})`, `A ${r.o_kind} reminder could not be sent after ${MAX_ATTEMPTS} tries.\n\n${msg}`, `<p>A ${esc(r.o_kind)} reminder for ${esc(r.o_email)} could not be sent after ${MAX_ATTEMPTS} tries.</p><p>${esc(msg)}</p>`, `alert-${r.o_id}`); } catch { /* the failed row and run log still record it */ }
      }
    }
  }
  if (out.claimed > 0 || out.failed > 0) await db.from("mr_run_log").insert({ job: "send", detail: out });
  return new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json" } });
});
