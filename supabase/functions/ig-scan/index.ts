import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Runs every 2 hours. Scans recent Instagram posts, creates campaigns for new keyword posts,
// runs the reply sender, flags possible misspellings, and emails the admin what needs a person.
// ?dry=1 reports what it would do without writing, sending or emailing.

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const GRAPH = "https://graph.facebook.com/v21.0";
const SITE = "https://sustainable-scholars.org";
const B44_APP = Deno.env.get("BASE44_APP_ID") ?? "69d8c767f023bd93d843becd";
const B44_KEY = Deno.env.get("BASE44_API_KEY");
const MS_TENANT = Deno.env.get("MS_TENANT_ID");
const MS_CLIENT = Deno.env.get("MS_CLIENT_ID");
const MS_SECRET = Deno.env.get("MS_CLIENT_SECRET");
const WINDOW_DAYS = 5;
const DM_TEXT = "Thank you for your interest in Sustainable Scholars, here is your link😊:";
const STOP = new Set(["the", "and", "for", "of", "at", "in", "to", "a", "scholarship", "scholarships", "program", "programs", "college", "university", "state", "national", "scholars"]);

const norm = (s: unknown) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const tokens = (s: unknown) => String(s ?? "").toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 3 && !STOP.has(t));
const esc = (t: unknown) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });

function lev(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

// "Comment XAVIER and I'll send you the link" -> XAVIER. Handles “JSU”, ELKS, USDA and similar.
function keywordFromCaption(caption: string): string | null {
  const m = caption.match(/comment\s*[“"'‘]?\s*([A-Za-z][A-Za-z0-9]{1,19})\b/i);
  return m ? m[1].toUpperCase() : null;
}

async function scholarships(): Promise<any[]> {
  if (!B44_KEY) throw new Error("BASE44_API_KEY is not set");
  const rows: any[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 20; page++) {
    const q = encodeURIComponent(JSON.stringify({ is_active: true }));
    const url = `https://app.base44.com/api/apps/${B44_APP}/entities/Scholarship/v2/list?q=${q}&limit=500` + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : "");
    const res = await fetch(url, { headers: { Authorization: `Bearer ${B44_KEY}` } });
    if (!res.ok) throw new Error(`Base44 HTTP ${res.status}`);
    const b: any = await res.json();
    const items = Array.isArray(b) ? b : (b.data ?? b.items ?? b.records ?? b.entities ?? null);
    if (!Array.isArray(items)) throw new Error("Unexpected Base44 response shape");
    rows.push(...items);
    cursor = b.has_more ? (b.next_cursor ?? null) : null;
    if (!cursor) break;
  }
  return rows.filter((r) => r.supabase_id && r.institution_name);
}

// Auto-picks a scholarship only when exactly one record fits the caption; otherwise the admin chooses.
function pickLink(caption: string, schs: any[]) {
  const capNorm = norm(caption);
  const capTokens = new Set(tokens(caption));
  const inst = schs.filter((s) => {
    const name = norm(String(s.institution_name).replace(/\b(university|college)\b/gi, ""));
    return name.length >= 5 && capNorm.includes(name);
  });
  if (!inst.length) return { status: "none", pick: null as any, top: [] as any[] };
  const scored = inst
    .map((s) => ({ s, score: new Set(tokens(s.scholarship_title).filter((t) => capTokens.has(t))).size }))
    .sort((a, b) => b.score - a.score);
  const best = scored[0].score;
  const top = scored.slice(0, 3).map((x) => x.s);
  const winners = scored.filter((x) => x.score === best);
  if (best >= 1 && winners.length === 1) return { status: "auto", pick: winners[0].s, top };
  return { status: "ambiguous", pick: null as any, top };
}

async function sendMail(to: string, subject: string, html: string) {
  if (!MS_TENANT || !MS_CLIENT || !MS_SECRET) throw new Error("Microsoft mail secrets are not set");
  const t = await fetch(`https://login.microsoftonline.com/${MS_TENANT}/oauth2/v2.0/token`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: MS_CLIENT, client_secret: MS_SECRET, scope: "https://graph.microsoft.com/.default", grant_type: "client_credentials" }),
  });
  const tok: any = await t.json().catch(() => ({}));
  if (!t.ok || !tok.access_token) throw new Error(`Microsoft token ${t.status}`);
  const r = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(to)}/sendMail`, {
    method: "POST", headers: { Authorization: `Bearer ${tok.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message: { subject, body: { contentType: "HTML", content: html }, toRecipients: [{ emailAddress: { address: to } }] }, saveToSentItems: true }),
  });
  if (r.status !== 202) throw new Error(`Graph sendMail ${r.status}`);
}

Deno.serve(async (req) => {
  const { data: s } = await db.from("ig_settings").select("*").eq("id", 1).single();
  if (!s || req.headers.get("x-cron-secret") !== s.cron_secret) return new Response("forbidden", { status: 403 });
  const dry = new URL(req.url).searchParams.get("dry") === "1";
  const report: any = { dry, newCampaigns: [], needsLink: [], misspellings: [], waiting: [], replies: null, errors: [] };
  const now = Date.now();

  // 1. Recent posts with no campaign yet: pull the keyword, pick the link, create the campaign.
  try {
    const { data: camps } = await db.from("ig_campaigns").select("post_id");
    const have = new Set((camps ?? []).map((c: any) => c.post_id));
    const r = await fetch(`${GRAPH}/${s.ig_user_id}/media?fields=id,caption,permalink,timestamp&limit=25&access_token=${encodeURIComponent(s.page_token)}`);
    const b: any = await r.json();
    if (!r.ok || b.error) throw new Error(b.error?.message ?? `HTTP ${r.status}`);
    const fresh = (b.data ?? []).filter((m: any) => (now - Date.parse(m.timestamp)) / 86400000 <= WINDOW_DAYS && !have.has(m.id));
    if (fresh.length) {
      const { data: al } = await db.from("ig_link_aliases").select("*");
      const alias = new Map((al ?? []).map((a: any) => [a.keyword, a]));
      const sch = await scholarships();
      for (const m of fresh) {
        const caption = String(m.caption ?? "");
        const kw = keywordFromCaption(caption);
        if (!kw) { report.needsLink.push({ key: `link:${m.id}`, post: m.permalink, why: "no 'Comment KEYWORD' in the caption" }); continue; }
        let link: string | null = null;
        let label = "";
        const a: any = alias.get(kw);
        if (a) {
          link = a.link_to_send; label = a.note ?? kw;
        } else {
          const pick = pickLink(caption, sch);
          if (pick.status === "auto") {
            link = `${SITE}/scholarship?id=${pick.pick.supabase_id}`;
            label = `${pick.pick.institution_name}: ${pick.pick.scholarship_title}`;
          } else {
            report.needsLink.push({
              key: `link:${m.id}`, post: m.permalink, keyword: kw,
              why: pick.status === "none" ? "no school in the database matches this caption" : "more than one scholarship fits this caption",
              options: pick.top.map((x: any) => `${x.institution_name}: ${x.scholarship_title} ${SITE}/scholarship?id=${x.supabase_id}`),
            });
            continue;
          }
        }
        const name = `Auto: ${label} (${m.id})`.slice(0, 180);
        report.newCampaigns.push({ keyword: kw, name, post: m.permalink, link });
        if (!dry) {
          const { error } = await db.from("ig_campaigns").insert({ campaign_name: name, keyword: kw, post_id: m.id, post_link: m.permalink, dm_message: DM_TEXT, link_to_send: link, status: "Active" });
          if (error) report.errors.push({ step: "create campaign", post: m.permalink, error: error.message });
        }
      }
    }
  } catch (e) {
    report.errors.push({ step: "scan posts", error: e instanceof Error ? e.message : String(e) });
  }

  // 2. Run the reply sender (DMs + public replies, logged in ig_handled).
  if (!dry && s.enabled) {
    try {
      const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/ig-run`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-cron-secret": s.cron_secret }, body: "{}",
      });
      report.replies = await r.json().catch(() => ({ status: r.status }));
    } catch (e) {
      report.errors.push({ step: "reply sender", error: e instanceof Error ? e.message : String(e) });
    }
  }

  // 3. Possible misspellings and unfamiliar comments waiting for a person (no DM is sent for either).
  try {
    const { data: active } = await db.from("ig_campaigns").select("keyword").eq("status", "Active");
    const kws = [...new Set((active ?? []).map((c: any) => norm(c.keyword)).filter((k: string) => k.length >= 4))];
    const { data: open } = await db.from("ig_needs_reply").select("comment_id,username,comment_text,campaign_name").eq("status", "New");
    for (const r of open ?? []) {
      const comment = String(r.comment_text ?? "");
      const words = comment.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
      let hit: { w: string; k: string } | null = null;
      for (const w of words) {
        const k = kws.find((kk: string) => w !== kk && lev(w, kk) <= (kk.length >= 7 ? 2 : 1));
        if (k) { hit = { w, k }; break; }
      }
      if (hit) {
        report.misspellings.push({ key: `misspell:${r.comment_id}`, user: r.username, comment: comment.slice(0, 120), looksLike: hit.k.toUpperCase(), campaign: r.campaign_name });
        if (!dry) await db.from("ig_needs_reply").update({ notes: `possible misspelling of ${hit.k.toUpperCase()}` }).eq("comment_id", r.comment_id);
      }
      report.waiting.push({ key: `review:${r.comment_id}`, user: r.username, comment: comment.slice(0, 120), campaign: r.campaign_name });
    }
  } catch (e) {
    report.errors.push({ step: "check comments", error: e instanceof Error ? e.message : String(e) });
  }

  // 4. Email the admin only about items not already reported.
  try {
    const { data: seenRows } = await db.from("ig_alerts").select("alert_key");
    const seen = new Set((seenRows ?? []).map((r: any) => r.alert_key));
    const news = (arr: any[]) => arr.filter((x) => x.key && !seen.has(x.key));
    const needs = news(report.needsLink), mis = news(report.misspellings), wait = news(report.waiting);
    const count = needs.length + mis.length + wait.length;
    if (!dry && (count || report.newCampaigns.length || report.errors.length)) {
      const sec = (title: string, body: string) => (body ? `<h3 style="margin:18px 0 6px">${title}</h3>${body}` : "");
      const li = (arr: string[]) => `<ul>${arr.map((x) => `<li>${x}</li>`).join("")}</ul>`;
      let html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5">`;
      html += sec("New campaigns (DMs start on the next run)", report.newCampaigns.length ? li(report.newCampaigns.map((c: any) => `${esc(c.keyword)}: ${esc(c.name)} &rarr; ${esc(c.link)}`)) : "");
      html += sec("Needs your decision (no campaign created)", needs.length ? li(needs.map((x: any) => `${esc(x.post)} (${esc(x.keyword ?? "no keyword")}): ${esc(x.why)}${x.options?.length ? "<br>Options: " + x.options.map((o: string) => esc(o)).join(" | ") : ""}`)) : "");
      html += sec("Possible misspellings (no DM sent)", mis.length ? li(mis.map((x: any) => `@${esc(x.user)} wrote &quot;${esc(x.comment)}&quot; (looks like ${esc(x.looksLike)})`)) : "");
      html += sec("Unfamiliar comments waiting for a person", wait.length ? li(wait.slice(0, 30).map((x: any) => `@${esc(x.user)} on ${esc(x.campaign)}: &quot;${esc(x.comment)}&quot;`)) : "");
      html += sec("Replies this run", report.replies ? `<p>Sent ${esc(report.replies.sent ?? 0)}, repeats skipped ${esc(report.replies.duplicates ?? 0)}, sent to Needs Reply ${esc(report.replies.review ?? 0)}, failed ${esc(report.replies.failed ?? 0)}</p>` : "");
      html += sec("Errors", report.errors.length ? li(report.errors.map((e: any) => esc(JSON.stringify(e)).slice(0, 300))) : "");
      html += `</div>`;
      await sendMail(s.owner_email, `Instagram: ${report.newCampaigns.length} new campaign(s), ${count} need you`, html);
      const keys = [...needs, ...mis, ...wait].map((x: any) => ({ alert_key: x.key }));
      if (keys.length) await db.from("ig_alerts").upsert(keys, { onConflict: "alert_key", ignoreDuplicates: true });
      report.emailed = true;
    }
  } catch (e) {
    report.errors.push({ step: "email admin", error: e instanceof Error ? e.message : String(e) });
  }

  return json(report);
});
