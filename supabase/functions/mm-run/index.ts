import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

// Matchmaking / Success Circle run. Called every 10 minutes by pg_cron (x-cron-secret header).
// Only intakes created after mm_settings.go_live_after are handled.
// mode: dry = preview only, writes nothing | test = sends to owner_email only | live = sends to the student.
// Rules: grade 11th or 12th AND gpa > 3.5. No GPA -> review. Top 3 must include >= 1 institutional
// scholarship and all 3 must be open to date (days_left >= 0). Otherwise -> review.

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const APP_ID = Deno.env.get("BASE44_APP_ID") ?? "69d8c767f023bd93d843becd";
const B44_KEY = Deno.env.get("BASE44_API_KEY");
const MS_TENANT = Deno.env.get("MS_TENANT_ID");
const MS_CLIENT = Deno.env.get("MS_CLIENT_ID");
const MS_SECRET = Deno.env.get("MS_CLIENT_SECRET");
const MAX_ATTEMPTS = 3;
const SITE = "https://sustainable-scholars.org";

const esc = (t: string) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

// Base44 stores naive UTC timestamps (no zone suffix); treat them as UTC.
const utc = (s: string) => new Date(/Z|[+-]\d\d:?\d\d$/.test(s) ? s : s + "Z").getTime();

async function b44List(entity: string, q: object, max = 1000): Promise<any[]> {
  const out: any[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 20 && out.length < max; page++) {
    const url = `https://app.base44.com/api/apps/${APP_ID}/entities/${entity}/v2/list?q=${encodeURIComponent(JSON.stringify(q))}&limit=100` + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : "");
    const res = await fetch(url, { headers: { Authorization: `Bearer ${B44_KEY}` } });
    if (!res.ok) throw new Error(`Base44 ${entity} ${res.status}`);
    const body = await res.json();
    out.push(...(body.items ?? body.data ?? body.entities ?? []));
    cursor = body.next_cursor ?? body.nextCursor ?? null;
    if (!cursor) break;
  }
  return out;
}

type Pick = { name: string; institution: string; source: string; award_amount: string; deadline: string; days_left: number; application_url: string };

// Pick the top 3 from a MatchResult. Only scholarships open to date (days_left >= 0) count.
// Requires at least one institutional scholarship among the three.
function selectTop3(matches: any[]): { picks?: Pick[]; reason?: string } {
  const open = matches.filter((m) => typeof m.days_left === "number" && m.days_left >= 0 && m.name && m.application_url);
  if (open.length < 3) return { reason: `only ${open.length} scholarships open to date (need 3)` };
  const inst = open.filter((m) => m.source === "institutional");
  if (inst.length === 0) return { reason: "no open institutional scholarship" };
  // Lead with the best institutional match, then fill from the rest in the order the matcher ranked them.
  const first = inst[0];
  const rest = open.filter((m) => m !== first);
  const picks = [first, ...rest].slice(0, 3);
  return {
    picks: picks.map((m) => ({
      name: m.name, institution: m.institution ?? "", source: m.source,
      award_amount: m.award_amount ?? "", deadline: m.deadline ?? "", days_left: m.days_left, application_url: m.application_url,
    })),
  };
}

async function buildPdf(first: string, picks: Pick[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([612, 792]);
  let y = 740;
  const line = (text: string, f = font, size = 11, gap = 16) => {
    page.drawText(text.slice(0, 110), { x: 54, y, size, font: f, color: rgb(0.1, 0.1, 0.1) });
    y -= gap;
  };
  line("Your Top 3 Scholarship Matches", bold, 18, 28);
  line(`Prepared for ${first} by Sustainable Scholars`, font, 11, 26);
  picks.forEach((p, i) => {
    line(`${i + 1}. ${p.name}`, bold, 13, 18);
    line(`Institution: ${p.institution}`);
    line(`Award: ${p.award_amount}`);
    line(`Deadline: ${p.deadline || "See application page"}  (${p.days_left} days left)`);
    line(`Apply: ${p.application_url}`, font, 10, 24);
  });
  line("Details and deadlines were checked on the date this was sent. Confirm on each official page before applying.", font, 9, 14);
  return await pdf.save();
}

function composeEmail(first: string, picks: Pick[]) {
  const subject = "Your top 3 scholarship matches (and an invitation)";
  const list = picks.map((p, i) => `${i + 1}. ${p.name} at ${p.institution}\n   ${p.award_amount}\n   Deadline: ${p.deadline || "see page"} (${p.days_left} days left)\n   ${p.application_url}`).join("\n\n");
  const text = `Hi ${first},\n\nYour three best-fit scholarships are in the attached PDF:\n\n${list}\n\nWant help building a plan for these? Join The Success Circle. Reply CIRCLE to this email and we will send you a link to book a call: ${SITE}/book-call\n\nSustainable Scholars`;
  const items = picks.map((p) => `<li style="margin-bottom:12px"><strong>${esc(p.name)}</strong> at ${esc(p.institution)}<br>${esc(p.award_amount)}<br>Deadline: ${esc(p.deadline || "see page")} (${p.days_left} days left)<br><a href="${esc(p.application_url)}">${esc(p.application_url)}</a></li>`).join("");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5"><p>Hi ${esc(first)},</p><p>Your three best-fit scholarships are in the attached PDF:</p><ol>${items}</ol><p>Want help building a plan for these? Join <strong>The Success Circle</strong>. <strong>Reply CIRCLE</strong> to this email and we will send you a link to book a call.</p><p>Sustainable Scholars</p></div>`;
  return { subject, text, html };
}

async function sendMail(from: string, to: string, subject: string, html: string, pdfB64: string, filename: string) {
  const tokenRes = await fetch(`https://login.microsoftonline.com/${MS_TENANT}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: MS_CLIENT!, client_secret: MS_SECRET!, scope: "https://graph.microsoft.com/.default", grant_type: "client_credentials" }),
  });
  const tok = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tok.access_token) throw new Error(`Microsoft token ${tokenRes.status}`);
  const res = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(from)}/sendMail`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tok.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        subject, body: { contentType: "HTML", content: html },
        toRecipients: [{ emailAddress: { address: to } }],
        attachments: [{ "@odata.type": "#microsoft.graph.fileAttachment", name: filename, contentType: "application/pdf", contentBytes: pdfB64 }],
      },
      saveToSentItems: true,
    }),
  });
  if (res.status !== 202) throw new Error(`Graph sendMail ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

const b64 = (bytes: Uint8Array) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

Deno.serve(async (req) => {
  const { data: s } = await db.from("mm_settings").select("*").eq("id", 1).single();
  if (!s || req.headers.get("x-cron-secret") !== s.cron_secret) return new Response("forbidden", { status: 403 });
  if (!s.enabled) return new Response(JSON.stringify({ skipped: "matchmaking disabled" }));
  if (!B44_KEY) return new Response(JSON.stringify({ error: "BASE44_API_KEY not set" }), { status: 500 });

  const goLive = new Date(s.go_live_after).getTime();
  const intakes = (await b44List("IntakeForm", { completed: true })).filter((i) => i.created_date && utc(i.created_date) >= goLive);

  const { data: ledgerRows } = await db.from("mm_matchmaking").select("intake_id,status,attempts").in("intake_id", intakes.map((i) => i.id).concat(["none"]));
  const ledger = new Map((ledgerRows ?? []).map((r: any) => [r.intake_id, r]));

  const counts = { scanned: intakes.length, new_intakes: 0, sent: 0, review: 0, ineligible: 0, waiting: 0, failed: 0 };
  const preview: any[] = [];

  for (const it of intakes) {
    const prev = ledger.get(it.id);
    // Already handled for this mode? test skips anything tested or sent; live skips only real sends.
    if (prev && (s.mode === "live" ? prev.status === "sent" : ["sent_test", "sent"].includes(prev.status))) continue;
    if (prev && ["review", "ineligible"].includes(prev.status)) continue;
    if (prev && prev.status === "failed" && prev.attempts >= MAX_ATTEMPTS) continue;
    counts.new_intakes++;

    const email = String(it.email ?? "").trim().toLowerCase();
    const first = String(it.first_name ?? "").trim().split(/\s+/)[0] || "there";
    const grade = String(it.grade_level ?? "");
    const gpa = typeof it.gpa === "number" ? it.gpa : it.gpa == null || it.gpa === "" ? null : Number(it.gpa);
    const base = { intake_id: it.id, email, first_name: first, grade, gpa };

    let status: string; let reason: string | null = null; let top3: Pick[] | null = null;
    if (!/11th|12th/i.test(grade)) { status = "ineligible"; reason = `grade: ${grade || "blank"}`; }
    else if (gpa == null || Number.isNaN(gpa)) { status = "review"; reason = "no GPA on intake"; }
    else if (!(gpa > 3.5)) { status = "ineligible"; reason = `GPA ${gpa} is not above 3.5`; }
    else {
      const mrs = await b44List("MatchResult", { target_email: email }, 5);
      mrs.sort((a, b) => utc(b.created_date ?? "1970") - utc(a.created_date ?? "1970"));
      if (!mrs.length) { status = "waiting_matches"; reason = "no MatchResult yet"; }
      else {
        let matches: any[] = [];
        try { matches = JSON.parse(mrs[0].matches ?? "[]"); } catch { matches = []; }
        const sel = selectTop3(matches);
        if (!sel.picks) { status = "review"; reason = sel.reason!; }
        else { status = "eligible"; top3 = sel.picks; }
      }
    }

    if (status === "eligible" && top3) {
      if (s.mode === "dry") { preview.push({ email, first, status: "would_send", top3: top3.map((p) => p.name) }); continue; }
      try {
        const mail = composeEmail(first, top3);
        const pdf = await buildPdf(first, top3);
        const to = s.mode === "test" ? s.owner_email : email;
        const subject = s.mode === "test" ? `[TEST for ${email}] ${mail.subject}` : mail.subject;
        await sendMail(s.from_email, to, subject, mail.html, b64(pdf), "Top-3-Scholarship-Matches.pdf");
        await db.from("mm_matchmaking").upsert({ ...base, status: s.mode === "test" ? "sent_test" : "sent", reason: null, top3, attempts: 0, provider_ref: null, updated_at: new Date().toISOString() });
        counts.sent++;
      } catch (e) {
        const attempts = (prev?.attempts ?? 0) + 1;
        await db.from("mm_matchmaking").upsert({ ...base, status: "failed", reason: String((e as Error).message).slice(0, 300), top3, attempts, updated_at: new Date().toISOString() });
        counts.failed++;
      }
      continue;
    }

    if (s.mode === "dry") { preview.push({ email, first, status, reason }); continue; }
    if (status === "waiting_matches") { counts.waiting++; continue; } // retried next run, no ledger row yet
    await db.from("mm_matchmaking").upsert({ ...base, status, reason, top3: null, updated_at: new Date().toISOString() });
    if (status === "review") counts.review++; else if (status === "ineligible") counts.ineligible++;
  }

  if (s.mode !== "dry") {
    await db.from("mm_run_log").insert({ mode: s.mode, ...counts, detail: { preview_count: preview.length } });
  }
  return new Response(JSON.stringify({ mode: s.mode, counts, preview }, null, 2), { headers: { "Content-Type": "application/json" } });
});
