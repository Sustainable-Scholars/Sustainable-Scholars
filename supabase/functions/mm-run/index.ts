import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, PDFName, PDFString, rgb } from "npm:pdf-lib@1.17.1";

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

type Pick = { name: string; institution: string; source?: string; award_amount: string; deadline: string; days_left: number; application_url: string; description?: string; tag?: string };

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
      description: m.fit_reason ?? "",
    })),
  };
}

// ---------- PDF: dark card layout, gold accents, clickable links ----------
const PAGE_W = 612, PAGE_H = 792;
const C = {
  bg: rgb(0.137, 0.149, 0.188),      // #232630
  card: rgb(0.165, 0.184, 0.239),    // #2A2F3D
  navy: rgb(0.118, 0.184, 0.302),    // #1E2F4D
  gold: rgb(0.788, 0.659, 0.298),    // #C9A84C
  white: rgb(1, 1, 1),
  text: rgb(0.85, 0.87, 0.9),
  muted: rgb(0.62, 0.65, 0.72),
  ink: rgb(0.12, 0.14, 0.2),
};

// Rounded rectangle as an SVG path, origin at its top-left corner (pdf-lib SVG paths grow downward).
const rrPath = (w: number, h: number, r: number) =>
  `M${r},0 H${w - r} A${r},${r} 0 0 1 ${w},${r} V${h - r} A${r},${r} 0 0 1 ${w - r},${h} H${r} A${r},${r} 0 0 1 0,${h - r} V${r} A${r},${r} 0 0 1 ${r},0 Z`;

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
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansB = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serifB = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const page = pdf.addPage([PAGE_W, PAGE_H]);
  const Y = (top: number) => PAGE_H - top; // convert "distance from top" to PDF y

  const link = (url: string, x: number, topY: number, w: number, h: number) => {
    const ref = pdf.context.register(pdf.context.obj({
      Type: PDFName.of("Annot"), Subtype: PDFName.of("Link"),
      Rect: [x, topY - h, x + w, topY],
      Border: [0, 0, 0],
      A: { Type: PDFName.of("Action"), S: PDFName.of("URI"), URI: PDFString.of(url) },
    }));
    page.node.addAnnot(ref);
  };

  // Background
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: C.bg });
  // Thin gold rule along the top edge
  page.drawRectangle({ x: 0, y: Y(6), width: PAGE_W, height: 4, color: C.gold });

  // Header
  page.drawText("SUSTAINABLE SCHOLARS  ·  GOLDEN TICKET", { x: 54, y: Y(62), size: 9, font: sansB, color: C.gold });
  page.drawText(`${displayName} Top 3 Scholarships`, { x: 54, y: Y(104), size: 28, font: serifB, color: C.white });

  // Cards
  const cardH = 140, cardW = 504, x0 = 54;
  let top = 136;
  picks.forEach((p, i) => {
    page.drawSvgPath(rrPath(cardW, cardH, 14), { x: x0, y: Y(top), color: C.card, borderColor: C.gold, borderWidth: 0.8 });
    let ty = top + 22;
    const rankLabel = `#${i + 1}${p.tag ? `  ·  ${p.tag}` : ""}`;
    page.drawText(rankLabel, { x: x0 + 20, y: Y(ty), size: 9.5, font: sansB, color: C.gold });
    ty += 17;
    const titleLines = wrap(p.name, sansB, 14, cardW - 40).slice(0, 2);
    for (const l of titleLines) { page.drawText(l, { x: x0 + 20, y: Y(ty + 11), size: 14, font: sansB, color: C.white }); ty += 18; }
    const sub = [p.institution, p.award_amount].filter(Boolean).join("  ·  ");
    for (const l of wrap(sub, sans, 9, cardW - 40).slice(0, 2)) { page.drawText(l, { x: x0 + 20, y: Y(ty + 9), size: 9, font: sans, color: C.muted }); ty += 13; }
    ty += 5;
    for (const l of wrap(p.description ?? "", sans, 9.5, cardW - 40).slice(0, 3)) { page.drawText(l, { x: x0 + 20, y: Y(ty + 9), size: 9.5, font: sans, color: C.text }); ty += 13; }
    // "View scholarship" link, pinned to the bottom of the card
    const linkTop = top + cardH - 18;
    const label = "View scholarship  >";
    page.drawText(label, { x: x0 + 20, y: Y(linkTop + 9), size: 10, font: sansB, color: C.gold });
    link(p.application_url, x0 + 20, linkTop + 9 + 2, sansB.widthOfTextAtSize(label, 10), 14);
    top += cardH + 16;
  });

  // Call to action
  const ctaTop = top + 6, ctaH = 96;
  page.drawSvgPath(rrPath(cardW, ctaH, 14), { x: x0, y: Y(ctaTop), color: C.navy, borderColor: C.gold, borderWidth: 0.6 });
  const head = "Your next step: a free 1:1 strategy session";
  page.drawText(head, { x: x0 + (cardW - serifB.widthOfTextAtSize(head, 17)) / 2, y: Y(ctaTop + 32), size: 17, font: serifB, color: C.white });
  const sub2 = "Meet with our team to see if you're a fit for The Success Circle.";
  page.drawText(sub2, { x: x0 + (cardW - sans.widthOfTextAtSize(sub2, 10)) / 2, y: Y(ctaTop + 50), size: 10, font: sans, color: C.text });
  const btnW = 210, btnH = 26, btnX = x0 + (cardW - btnW) / 2, btnTop = ctaTop + 60;
  page.drawSvgPath(rrPath(btnW, btnH, 13), { x: btnX, y: Y(btnTop), color: C.gold });
  const btnLabel = "BOOK YOUR SESSION";
  page.drawText(btnLabel, { x: btnX + (btnW - sansB.widthOfTextAtSize(btnLabel, 10)) / 2, y: Y(btnTop + 17), size: 10, font: sansB, color: C.ink });
  link(BOOK_URL, btnX, btnTop + btnH - 4, btnW, btnH);

  // Footer
  const foot = "Always verify eligibility and deadlines on the official scholarship page.";
  page.drawText(foot, { x: x0 + (cardW - sans.widthOfTextAtSize(foot, 8)) / 2, y: Y(PAGE_H - 60), size: 8, font: sans, color: C.muted });

  return await pdf.save();
}

// ---------- Email body (copy from the approved mock-up) ----------
function composeEmail(first: string, picks: Pick[]) {
  const subject = "Your top 3 scholarship matches";
  const items = picks.map((p, i) => `<tr><td style="padding:0 0 14px"><div style="background:#2A2F3D;border:1px solid #C9A84C;border-radius:12px;padding:16px 18px;color:#E8ECF2">
      <div style="color:#C9A84C;font-size:12px;font-weight:bold">#${i + 1}${p.tag ? `  ·  ${esc(p.tag)}` : ""}</div>
      <div style="font-size:16px;font-weight:bold;color:#FFFFFF;margin-top:4px">${esc(p.name)}</div>
      <div style="color:#A9AEBD;font-size:13px;margin-top:4px">${esc([p.institution, p.award_amount].filter(Boolean).join(" · "))}</div>
      <div style="font-size:14px;margin-top:8px">${esc(p.description ?? "")}</div>
      <div style="margin-top:10px"><a href="${esc(p.application_url)}" style="color:#C9A84C;font-weight:bold;text-decoration:none">View scholarship &rsaquo;</a></div>
    </div></td></tr>`).join("");
  const html = `<div style="background:#232630;padding:28px 16px;font-family:Arial,Helvetica,sans-serif;color:#E8ECF2">
    <div style="max-width:560px;margin:0 auto">
      <div style="color:#C9A84C;font-size:11px;font-weight:bold;letter-spacing:1px">SUSTAINABLE SCHOLARS &middot; GOLDEN TICKET</div>
      <h1 style="font-family:Georgia,'Times New Roman',serif;color:#FFFFFF;font-size:26px;margin:8px 0 14px">${esc(first)}, your top 3 scholarships</h1>
      <p style="font-size:15px;line-height:1.5">Hi ${esc(first)}, your three best-fit scholarships are below and in the attached PDF.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${items}</table>
      <div style="background:#1E2F4D;border:1px solid #C9A84C;border-radius:12px;padding:22px;text-align:center;margin-top:8px">
        <div style="font-family:Georgia,'Times New Roman',serif;color:#FFFFFF;font-size:19px;font-weight:bold">Your next step: a free 1:1 strategy session</div>
        <div style="color:#E8ECF2;font-size:14px;margin-top:6px">Meet with our team to see if you're a fit for The Success Circle.</div>
        <div style="margin-top:14px"><a href="${BOOK_URL}" style="background:#C9A84C;color:#232630;font-weight:bold;font-size:13px;text-decoration:none;padding:10px 22px;border-radius:20px;display:inline-block">BOOK YOUR SESSION</a></div>
        <div style="color:#A9AEBD;font-size:13px;margin-top:14px">Or reply <strong style="color:#C9A84C">CIRCLE</strong> to this email and we will send you the booking link.</div>
      </div>
      <p style="color:#A9AEBD;font-size:11px;text-align:center;margin-top:18px">Always verify eligibility and deadlines on the official scholarship page.<br>Sustainable Scholars</p>
    </div></div>`;
  const text = `Hi ${first},\n\nYour three best-fit scholarships are in the attached PDF.\n\n` +
    picks.map((p, i) => `#${i + 1} ${p.name} (${p.institution})\n${p.award_amount}\nView: ${p.application_url}`).join("\n\n") +
    `\n\nYour next step: a free 1:1 strategy session. Book here: ${BOOK_URL}\nOr reply CIRCLE to this email and we will send you the booking link.\n\nSustainable Scholars`;
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

  // Test-only preview: renders the design with given picks and sends it to the owner address. Never to a student.
  const body = await req.json().catch(() => ({}));
  if (body.test_design) {
    if (s.mode !== "test") return new Response(JSON.stringify({ error: "test_design needs mode=test" }), { status: 400 });
    const d = body.test_design;
    const pdf = await buildPdf(`${d.first} ${d.last}`.trim(), d.picks);
    const mail = composeEmail(d.first, d.picks);
    await sendMail(s.from_email, s.owner_email, `[TEST for ${d.email}] ${mail.subject}`, mail.html, b64(pdf), "Top-3-Scholarships.pdf");
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
        const pdf = await buildPdf(`${first}`, top3);
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
