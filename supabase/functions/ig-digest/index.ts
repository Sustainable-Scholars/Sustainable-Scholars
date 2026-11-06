import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Daily Needs Reply email. Replaces the Activepieces "Instagram Needs Reply: daily email summary" flow.
// Cron calls this hourly; it only acts at ig_settings.digest_hour local time, once per day (?force=1 overrides).

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const MS_TENANT = Deno.env.get("MS_TENANT_ID");
const MS_CLIENT = Deno.env.get("MS_CLIENT_ID");
const MS_SECRET = Deno.env.get("MS_CLIENT_SECRET");
const esc = (t: unknown) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });

async function sendMail(from: string, to: string, subject: string, html: string) {
  if (!MS_TENANT || !MS_CLIENT || !MS_SECRET) throw new Error("Microsoft mail secrets are not set");
  const t = await fetch(`https://login.microsoftonline.com/${MS_TENANT}/oauth2/v2.0/token`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: MS_CLIENT, client_secret: MS_SECRET, scope: "https://graph.microsoft.com/.default", grant_type: "client_credentials" }),
  });
  const tok = await t.json().catch(() => ({}));
  if (!t.ok || !tok.access_token) throw new Error(`Microsoft token ${t.status}`);
  const r = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(from)}/sendMail`, {
    method: "POST", headers: { Authorization: `Bearer ${tok.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message: { subject, body: { contentType: "HTML", content: html }, toRecipients: [{ emailAddress: { address: to } }] }, saveToSentItems: true }),
  });
  if (r.status !== 202) throw new Error(`Graph sendMail ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

Deno.serve(async (req) => {
  const { data: s } = await db.from("ig_settings").select("*").eq("id", 1).single();
  if (!s || req.headers.get("x-cron-secret") !== s.cron_secret) return new Response("forbidden", { status: 403 });
  if (!s.enabled) return json({ skipped: "disabled" });

  const force = new URL(req.url).searchParams.get("force") === "1";
  const now = new Date();
  const local = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-CA", { timeZone: s.display_tz, ...o }).format(now);
  const localDate = local({ year: "numeric", month: "2-digit", day: "2-digit" });
  const localHour = Number(local({ hour: "numeric", hour12: false })) % 24;
  if (!force && (localHour !== s.digest_hour || s.last_digest_date === localDate)) return json({ skipped: "not digest time" });

  const { data: items } = await db.from("ig_needs_reply").select("*").eq("status", "New").order("commented_at", { ascending: true });
  const since = new Date(now.getTime() - 24 * 3600000).toISOString();
  const { data: failed } = await db.from("ig_handled").select("username,campaign_name,error,handled_at").eq("result", "Failed").gte("handled_at", since);
  const { data: errs } = await db.from("ig_run_log").select("ran_at,detail").gte("ran_at", since).not("detail->>error", "is", null);
  const stuck = await db.from("ig_handled").select("username,campaign_name").eq("result", "Pending").lt("handled_at", new Date(now.getTime() - 3600000).toISOString());

  if (!(items?.length || failed?.length || errs?.length || stuck.data?.length)) {
    await db.from("ig_settings").update({ last_digest_date: localDate }).eq("id", 1);
    return json({ sent: false, reason: "nothing to report" });
  }

  const fmt = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: s.display_tz, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
  const byCampaign = new Map<string, any[]>();
  for (const it of items ?? []) byCampaign.set(it.campaign_name, [...(byCampaign.get(it.campaign_name) ?? []), it]);

  let html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5"><h2 style="margin:0 0 8px">Instagram: ${items?.length ?? 0} comment${items?.length === 1 ? "" : "s"} need a reply</h2>`;
  html += `<p>Open the post, tap the comment, and answer from your phone. Or ask Claude to draft the replies.</p>`;
  for (const [name, rows] of byCampaign) {
    html += `<h3 style="margin:16px 0 4px">${esc(name)}</h3><table style="border-collapse:collapse;width:100%">`;
    for (const r of rows) {
      html += `<tr><td style="padding:4px 8px;border-bottom:1px solid #eee;white-space:nowrap">${esc(fmt(r.commented_at))}</td><td style="padding:4px 8px;border-bottom:1px solid #eee">@${esc(r.username)}</td><td style="padding:4px 8px;border-bottom:1px solid #eee">${r.type === "Question" ? "Question" : "Comment"}</td><td style="padding:4px 8px;border-bottom:1px solid #eee">${esc(r.comment_text)}</td><td style="padding:4px 8px;border-bottom:1px solid #eee">${r.post_link ? `<a href="${esc(r.post_link)}">Open post</a>` : ""}</td></tr>`;
    }
    html += `</table>`;
  }
  if (failed?.length) {
    html += `<h3 style="margin:16px 0 4px;color:#b00020">DMs that failed (last 24 hours)</h3><ul>`;
    for (const f of failed) html += `<li>@${esc(f.username)} (${esc(f.campaign_name)}): ${esc(String(f.error ?? "").slice(0, 160))}</li>`;
    html += `</ul>`;
  }
  if (stuck.data?.length) html += `<p style="color:#b00020"><strong>${stuck.data.length}</strong> comment(s) are stuck mid-send. Ask Claude to check them.</p>`;
  if (errs?.length) html += `<p style="color:#b00020"><strong>System errors in the last 24 hours:</strong> ${errs.length}. First: ${esc(JSON.stringify(errs[0].detail).slice(0, 200))}</p>`;
  html += `</div>`;

  await sendMail(s.owner_email, s.owner_email, `Instagram: ${items?.length ?? 0} comment${items?.length === 1 ? "" : "s"} need a reply${failed?.length ? ` (+${failed.length} failed DMs)` : ""}`, html);
  const ids = (items ?? []).map((i: any) => i.comment_id);
  for (let i = 0; i < ids.length; i += 100) await db.from("ig_needs_reply").update({ status: "Emailed", emailed_at: now.toISOString() }).in("comment_id", ids.slice(i, i + 100));
  await db.from("ig_settings").update({ last_digest_date: localDate }).eq("id", 1);
  await db.from("ig_run_log").insert({ job: "digest", detail: { emailed: ids.length, failed: failed?.length ?? 0 } });
  return json({ sent: true, items: ids.length });
});
