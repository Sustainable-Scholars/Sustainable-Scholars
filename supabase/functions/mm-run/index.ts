import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, PDFName, PDFString, rgb } from "npm:pdf-lib@1.17.1";

// Matchmaking / Success Circle run. Called every 10 minutes by pg_cron (x-cron-secret header).
// Only intakes created after mm_settings.go_live_after are handled.
// mode: dry = preview only, writes nothing | test = sends to owner_email only | live = sends to the student.
// Rules: grade 11th or 12th AND gpa > 3.5. No GPA -> review. Top 3 must include >= 1 institutional
// scholarship and all 3 must be open to date (days_left >= 0). Every pick must exist and be active in Supabase.
// Otherwise -> review.

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const APP_ID = Deno.env.get("BASE44_APP_ID") ?? "69d8c767f023bd93d843becd";
const B44_KEY = Deno.env.get("BASE44_API_KEY");
const MS_TENANT = Deno.env.get("MS_TENANT_ID");
const MS_CLIENT = Deno.env.get("MS_CLIENT_ID");
const MS_SECRET = Deno.env.get("MS_CLIENT_SECRET");
const MAX_ATTEMPTS = 3;
const SITE = "https://sustainable-scholars.org";
const BOOK_URL = `${SITE}/book-call`;

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

type Pick = { name: string; institution: string; award_amount: string; deadline: string; days_left: number; description?: string; tag?: string; sb_table: "inst" | "program"; sb_id: string; site_url: string };

// Site page for a pick: institutional scholarships open their own page; national programs open the search page.
const siteUrl = (table: "inst" | "program", id: string, name: string) =>
  table === "inst" ? `${SITE}/scholarship?id=${id}` : `${SITE}/all-scholarships?q=${encodeURIComponent(name)}`;

// Keep only matches whose scholarship exists and is active in Supabase (the source of truth for what we send).
async function listedInSupabase(matches: any[]): Promise<any[]> {
  const instIds: string[] = [], progIds: string[] = [];
  for (const m of matches) {
    const id = String(m.scholarship_id ?? "");
    if (id.startsWith("inst:")) instIds.push(id.slice(5));
    else if (id.startsWith("program:")) progIds.push(id.slice(8));
  }
  const active = new Set<string>();
  if (instIds.length) {
    const { data } = await db.from("institutional_scholarships").select("id,status").in("id", instIds);
    for (const r of data ?? []) if (r.status === "active") active.add(`inst:${r.id}`);
  }
  if (progIds.length) {
    const { data } = await db.from("scholarship_programs").select("id,status").in("id", progIds);
    for (const r of data ?? []) if (r.status === "active") active.add(`program:${r.id}`);
  }
  return matches.filter((m) => active.has(String(m.scholarship_id ?? "")));
}

// Pick the top 3 from listed matches. Only scholarships open to date (days_left >= 0) count.
// Requires at least one institutional scholarship among the three.
function selectTop3(matches: any[]): { picks?: Pick[]; reason?: string } {
  const open = matches.filter((m) => typeof m.days_left === "number" && m.days_left >= 0 && m.name);
  if (open.length < 3) return { reason: `only ${open.length} listed scholarships open to date (need 3)` };
  const inst = open.filter((m) => String(m.scholarship_id).startsWith("inst:"));
  if (inst.length === 0) return { reason: "no open institutional scholarship in Supabase" };
  // Lead with the best institutional match, then fill from the rest in the order the matcher ranked them.
  const first = inst[0];
  const rest = open.filter((m) => m !== first);
  const picks = [first, ...rest].slice(0, 3);
  return {
    picks: picks.map((m) => {
      const id = String(m.scholarship_id);
      const sb_table = id.startsWith("inst:") ? "inst" as const : "program" as const;
      const sb_id = id.replace(/^(inst|program):/, "");
      return {
        name: m.name, institution: m.institution ?? "", award_amount: m.award_amount ?? "",
        deadline: m.deadline ?? "", days_left: m.days_left, description: m.fit_reason ?? "",
        sb_table, sb_id, site_url: siteUrl(sb_table, sb_id, m.name),
      };
    }),
  };
}

// ---------- PDF attachment: framed gold-on-charcoal template (the approved design) ----------
// All text comes from the student's Supabase-verified picks. Nothing is typed in by hand.
const PAGE_W = 612, PAGE_H = 792;
const C = {
  bg: rgb(0.118, 0.125, 0.141),      // charcoal
  panel: rgb(0.149, 0.157, 0.176),   // slightly lighter card fill
  gold: rgb(0.741, 0.612, 0.384),    // antique gold
  white: rgb(0.953, 0.945, 0.925),
  text: rgb(0.835, 0.826, 0.8),
  muted: rgb(0.62, 0.6, 0.56),
  ink: rgb(0.118, 0.125, 0.141),
};

function wrap(text: string, font: any, size: number, maxW: number): string[] {
  const words = String(text ?? "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(t, size) <= maxW) cur = t;
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

async function buildPdf(displayName: string, picks: Pick[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifB = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const serifI = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansB = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([PAGE_W, PAGE_H]);
  const Y = (top: number) => PAGE_H - top; // "distance from top" -> PDF y

  // Centered text; `base` is the baseline measured from the top of the page.
  const ctext = (text: string, font: any, size: number, base: number, color: any) => {
    const x = (PAGE_W - font.widthOfTextAtSize(text, size)) / 2;
    page.drawText(text, { x, y: Y(base), size, font, color });
  };
  // Clickable area: `top` is the top edge of the box, measured from the top of the page.
  const linkBox = (url: string, x: number, top: number, w: number, h: number) => {
    const ref = pdf.context.register(pdf.context.obj({
      Type: PDFName.of("Annot"), Subtype: PDFName.of("Link"),
      Rect: [x, Y(top) - h, x + w, Y(top)],
      Border: [0, 0, 0],
      A: { Type: PDFName.of("Action"), S: PDFName.of("URI"), URI: PDFString.of(url) },
    }));
    page.node.addAnnot(ref);
  };

  // Charcoal background and double gold frame
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: C.bg });
  page.drawRectangle({ x: 24, y: Y(24 + 744), width: 564, height: 744, borderColor: C.gold, borderWidth: 1.2 });
  page.drawRectangle({ x: 32, y: Y(32 + 728), width: 548, height: 728, borderColor: C.gold, borderWidth: 0.5 });

  // Header: student name, title, ornamental divider
  ctext(displayName, serifI, 18, 84, C.gold);
  ctext("Top 3 Scholarships", serifB, 34, 136, C.gold);
  page.drawLine({ start: { x: 170, y: Y(154) }, end: { x: 442, y: Y(154) }, thickness: 0.8, color: C.gold });
  page.drawCircle({ x: 306, y: Y(154), size: 3, color: C.gold });

  // Three framed scholarship boxes
  const cardX = 86, cardW = 440, cardH = 134, tops = [168, 312, 456];
  picks.slice(0, 3).forEach((p, i) => {
    const t = tops[i];
    page.drawRectangle({ x: cardX, y: Y(t + cardH), width: cardW, height: cardH, color: C.panel, borderColor: C.gold, borderWidth: 1 });
    page.drawRectangle({ x: cardX + 5, y: Y(t + cardH - 5), width: cardW - 10, height: cardH - 10, borderColor: C.gold, borderWidth: 0.4 });

    ctext(`SCHOLARSHIP #${i + 1}${p.tag ? `  ·  ${p.tag}` : ""}`, sansB, 7.5, t + 22, C.gold);

    // Name: up to two lines at 13pt, never cut off
    const nameLines = wrap(p.name, serifB, 13, 390);
    nameLines.forEach((l, k) => ctext(l, serifB, 13, t + 40 + k * 16, C.white));
    let base = t + 40 + (nameLines.length - 1) * 16;

    // Institution and award
    const subLines = wrap(`${p.institution}  ·  ${p.award_amount}`, sans, 8.5, 390);
    subLines.forEach((l, k) => ctext(l, sans, 8.5, base + 16 + k * 11, C.muted));
    base = base + 16 + (subLines.length - 1) * 11;

    // Description: use 8pt, drop to 7.5pt only if it needs more than three lines
    let descSize = 8;
    let descLines = wrap(p.description ?? "", serif, descSize, 390);
    if (descLines.length > 3) { descSize = 7.5; descLines = wrap(p.description ?? "", serif, descSize, 390); }
    descLines.forEach((l, k) => ctext(l, serif, descSize, base + 14 + k * 10, C.text));

    // Clickable "View scholarship" link to the site page
    const label = "VIEW SCHOLARSHIP  >";
    const lw = sansB.widthOfTextAtSize(label, 7.5);
    ctext(label, sansB, 7.5, t + 124, C.gold);
    linkBox(p.site_url, (PAGE_W - lw) / 2, t + 117, lw, 11);
  });

  // Call to action: two clickable booking buttons and the printed link
  ctext("Your next step: a free 1:1 strategy session", serifB, 15, 614, C.gold);
  ctext("Meet with our team to see if you're a fit for The Success Circle.", serif, 9.5, 631, C.text);

  const btnW = 230, btnH = 26, btnX = (PAGE_W - btnW) / 2;
  // Button 1: filled
  page.drawRectangle({ x: btnX, y: Y(640 + btnH), width: btnW, height: btnH, color: C.gold });
  const b1 = "BOOK YOUR SESSION";
  page.drawText(b1, { x: btnX + (btnW - sansB.widthOfTextAtSize(b1, 9.5)) / 2, y: Y(657), size: 9.5, font: sansB, color: C.ink });
  linkBox(BOOK_URL, btnX, 640, btnW, btnH);
  // Button 2: outlined
  page.drawRectangle({ x: btnX, y: Y(674 + btnH), width: btnW, height: btnH, borderColor: C.gold, borderWidth: 1 });
  const b2 = "BOOK YOUR FREE STRATEGY CALL";
  page.drawText(b2, { x: btnX + (btnW - sansB.widthOfTextAtSize(b2, 9)) / 2, y: Y(691), size: 9, font: sansB, color: C.gold });
  linkBox(BOOK_URL, btnX, 674, btnW, btnH);

  const urlLabel = "sustainable-scholars.org/book-call";
  const uw = sans.widthOfTextAtSize(urlLabel, 8.5);
  ctext(urlLabel, sans, 8.5, 716, C.gold);
  linkBox(BOOK_URL, (PAGE_W - uw) / 2, 707, uw, 12);

  ctext("Always verify eligibility and deadlines on the official scholarship page.", serif, 7.5, 738, C.muted);

  return await pdf.save();
}

// ---------- Email: body and subject copied from the approved Outlook draft ----------
function composeEmail(first: string, _picks: Pick[]) {
  const subject = "Congratulations, You’ve Been Matched!!";
  const html = `\r\n<div style="font-family:Georgia,'Times New Roman',serif;font-size:11pt;color:#000;line-height:1.5"><p>Dear ${esc(first)},</p><p>Thank you for taking the time to complete your introductory Match Making Form. We are excited to share the top 3 scholarships that we believe will be useful on your journey to graduating debt free!</p><p>Your next step: we would love to see if you are a fit for our newest program, <b>The Success Circle</b>. Inside The Success Circle, we work alongside you to maximize the aid you receive, including:</p><ol style="margin:0 0 12px 20px;padding:0"><li>Matching you with colleges that offer strong institutional scholarships</li><li>Support with scholarship essay creation</li><li>Finding additional scholarships that match your profile</li></ol><p>Simply reply to this email with the word <b>CIRCLE</b>, and a member of our team will follow up with you directly to determine your eligibility.</p><p>Best regards,</p><p style="margin:0"><b>Cameron Cary</b><br />Sustainable Scholars Founder</p><p style="margin:16px 0 0;font-style:italic">“Helping You Land Your Debt-Free Degree”</p><p style="margin:12px 0 0"><a href="${SITE}" style="color:#1c2d4a">Click Here for More Information</a></p><p style="margin:12px 0 0"></p></div>`;
  const text = `Dear ${first},\n\nThank you for taking the time to complete your introductory Match Making Form. We are excited to share the top 3 scholarships that we believe will be useful on your journey to graduating debt free!\n\nYour next step: we would love to see if you are a fit for our newest program, The Success Circle. Inside The Success Circle, we work alongside you to maximize the aid you receive, including:\n1. Matching you with colleges that offer strong institutional scholarships\n2. Support with scholarship essay creation\n3. Finding additional scholarships that match your profile\n\nSimply reply to this email with the word CIRCLE, and a member of our team will follow up with you directly to determine your eligibility.\n\nBest regards,\nCameron Cary\nSustainable Scholars Founder\n“Helping You Land Your Debt-Free Degree”\n${SITE}`;
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

  // Test-only preview: renders the email and PDF with given picks and sends them to the owner address. Never to a student.
  const body = await req.json().catch(() => ({}));
  if (body.test_design) {
    if (s.mode !== "test") return new Response(JSON.stringify({ error: "test_design needs mode=test" }), { status: 400 });
    const d = body.test_design;
    const name = `${d.first} ${d.last}`.trim();
    const picks: Pick[] = d.picks.map((p: any) => ({ ...p, site_url: siteUrl(p.sb_table, p.sb_id, p.name) }));
    const pdf = await buildPdf(name, picks);
    const mail = composeEmail(d.first, picks);
    await sendMail(s.from_email, s.owner_email, `[TEST for ${d.email}] ${mail.subject}`, mail.html, b64(pdf), `${name.replace(/\s+/g, "_")}_Top_3_Scholarships.pdf`);
    return new Response(JSON.stringify({ sent_test_design_to: s.owner_email }));
  }

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
    const fullName = `${String(it.first_name ?? "").trim()} ${String(it.last_name ?? "").trim()}`.trim() || first;
    const grade = String(it.grade_level ?? "");
    const gpa = typeof it.gpa === "number" ? it.gpa : it.gpa == null || it.gpa === "" ? null : Number(it.gpa);
    const base = { intake_id: it.id, email, first_name: first, grade, gpa };

    let status: string; let reason: string | null = null; let top3: Pick[] | null = null;
    if (!/11th|12th/i.test(grade)) { status = "ineligible"; reason = `grade: ${grade || "blank"}`; }
    else if (gpa == null || Number.isNaN(gpa)) { status = "review"; reason = "no GPA on intake"; }
    else if (!(gpa > 3.5)) { status = "ineligible"; reason = `GPA ${gpa} is not above 3.5`; }
    else {
      // MatchResult stores target_email exactly as submitted (case matters), so query with the original spelling.
      const mrs = await b44List("MatchResult", { target_email: String(it.email ?? "").trim() }, 5);
      mrs.sort((a, b) => utc(b.created_date ?? "1970") - utc(a.created_date ?? "1970"));
      if (!mrs.length) { status = "waiting_matches"; reason = "no MatchResult yet"; }
      else {
        let matches: any[] = [];
        try { matches = JSON.parse(mrs[0].matches ?? "[]"); } catch { matches = []; }
        const sel = selectTop3(await listedInSupabase(matches));
        if (!sel.picks) { status = "review"; reason = sel.reason!; }
        else { status = "eligible"; top3 = sel.picks; }
      }
    }

    if (status === "eligible" && top3) {
      if (s.mode === "dry") { preview.push({ email, first, status: "would_send", top3: top3.map((p) => p.name), links: top3.map((p) => p.site_url) }); continue; }
      try {
        const mail = composeEmail(first, top3);
        const pdf = await buildPdf(fullName, top3);
        const to = s.mode === "test" ? s.owner_email : email;
        const subject = s.mode === "test" ? `[TEST for ${email}] ${mail.subject}` : mail.subject;
        await sendMail(s.from_email, to, subject, mail.html, b64(pdf), `${fullName.replace(/\s+/g, "_")}_Top_3_Scholarships.pdf`);
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
