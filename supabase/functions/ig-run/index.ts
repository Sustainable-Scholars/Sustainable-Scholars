import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Instagram comment-to-DM. Replaces the Activepieces "Instagram Comment-to-DM (master)" flow.
// Every run: read comments on each Active campaign post, DM + publicly reply to keyword commenters,
// and send everything else (questions, off-topic) to ig_needs_reply for a person.
// mode: dry = report only (no sends, no writes), live = send and log.

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const GRAPH = "https://graph.facebook.com/v21.0";
const QUESTION_START = /^\s*(how|what|when|where|why|who|which|is|are|do|does|did|can|could|will|would|should)\b/i;
// keyword matching ignores capitalization, spaces and punctuation ("OHIO STATE" matches OHIOSTATE)
const norm = (s: string) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const PUBLIC_REPLIES = [
  "Check your DM’s for the link📩",
  "Our team has sent you the link, check your DM’s📲",
  "You ask and you shall receive, check your DM’s🙌",
];
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });

async function graph(method: "GET" | "POST", path: string, params: Record<string, string>, token: string) {
  const body = new URLSearchParams({ ...params, access_token: token });
  const res = method === "GET"
    ? await fetch(`${GRAPH}/${path}?${body}`)
    : await fetch(`${GRAPH}/${path}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  const out: any = await res.json().catch(() => ({}));
  if (!res.ok || out.error) {
    const e = out.error ?? {};
    throw new Error(`${e.message ?? "HTTP " + res.status}${e.code ? ` (code ${e.code}${e.error_subcode ? "/" + e.error_subcode : ""})` : ""}`);
  }
  return out;
}

async function fetchAll(table: string, cols: string, build: (q: any) => any) {
  const rows: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build(db.from(table).select(cols)).range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

Deno.serve(async (req) => {
  const { data: s } = await db.from("ig_settings").select("*").eq("id", 1).single();
  if (!s || req.headers.get("x-cron-secret") !== s.cron_secret) return new Response("forbidden", { status: 403 });
  if (!s.enabled) return json({ skipped: "disabled" });
  if (!s.page_token) return json({ error: "ig_settings.page_token is empty" }, 500);
  const live = s.mode === "live";
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);

  const { data: camps } = await db.from("ig_campaigns").select("*").eq("status", "Active");
  const active = (camps ?? []).filter((c: any) => norm(c.keyword) && c.post_id && c.link_to_send && (!c.ends_on || String(c.ends_on) >= today));
  const byPost = new Map<string, any[]>();
  for (const c of active) byPost.set(c.post_id, [...(byPost.get(c.post_id) ?? []), c]);

  // One link per person per post, however many campaigns or keywords share that post.
  const sentRows = byPost.size
    ? await fetchAll("ig_handled", "post_id,username", (q) => q.eq("result", "Sent").in("post_id", [...byPost.keys()]))
    : [];
  const sentKeys = new Set(sentRows.map((r: any) => `${r.post_id}|${String(r.username ?? "").toLowerCase()}`));

  const todoAll: any[] = [];
  const reviewAll: any[] = [];
  const errors: any[] = [];
  const batchKeys = new Set<string>();

  for (const [postId, group] of byPost) {
    let comments: any[] = [];
    let after: string | undefined;
    try {
      for (let page = 0; page < 5; page++) {
        const out = await graph("GET", `${postId}/comments`, { fields: "id,text,username,timestamp,hidden", limit: "100", ...(after ? { after } : {}) }, s.page_token);
        comments = comments.concat(out.data ?? []);
        after = out.paging?.next ? out.paging?.cursors?.after : undefined;
        if (!after) break;
      }
    } catch (e) {
      errors.push({ post: postId, campaign: group[0].campaign_name, error: e instanceof Error ? e.message : String(e) });
      continue;
    }
    const ids = comments.map((c) => String(c.id));
    const handled = new Set<string>();
    for (let i = 0; i < ids.length; i += 100) {
      const { data } = await db.from("ig_handled").select("comment_id").in("comment_id", ids.slice(i, i + 100));
      for (const r of data ?? []) handled.add(r.comment_id);
    }
    comments.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    for (const cm of comments) {
      if (!cm?.id || handled.has(String(cm.id)) || cm.hidden) continue;
      const username = String(cm.username ?? "");
      if (!username || username.toLowerCase() === s.own_username) continue;
      const text = String(cm.text ?? "");
      const ts = Date.parse(cm.timestamp);
      if (!ts) continue;
      const matched = group.find((c) => norm(text).includes(norm(c.keyword)));
      const isQuestion = text.includes("?") || QUESTION_START.test(text);

      if (matched && !isQuestion) {
        if (now - ts > s.dm_window_days * 86400000) continue;     // too old for a private reply
        const key = `${postId}|${username.toLowerCase()}`;
        if (sentKeys.has(key) || batchKeys.has(key)) {
          todoAll.push({ dup: true, commentId: String(cm.id), username, text, ts, campaign: matched.campaign_name, postId });
          continue;
        }
        batchKeys.add(key);
        todoAll.push({
          commentId: String(cm.id), username, text, ts, campaign: matched.campaign_name, postId,
          dm: `${matched.dm_message} ${matched.link_to_send}`.trim(),
          reply: PUBLIC_REPLIES[Math.floor(Math.random() * PUBLIC_REPLIES.length)],
        });
      } else {
        if (now - ts > s.review_window_days * 86400000) continue;
        const c = matched ?? group[0];
        reviewAll.push({ commentId: String(cm.id), username, text, ts, campaign: c.campaign_name, postId, postLink: c.post_link, type: isQuestion ? "Question" : "Other" });
      }
    }
  }

  if (byPost.size > 0 && errors.length >= byPost.size) {
    const detail = { error: "Instagram rejected every comment read", first: errors[0] };
    await db.from("ig_run_log").insert({ job: "run", detail });
    return json(detail, 502);   // a green run must mean a real check
  }

  todoAll.sort((a, b) => a.ts - b.ts);
  reviewAll.sort((a, b) => a.ts - b.ts);
  const dups = todoAll.filter((t) => t.dup);
  const todo = todoAll.filter((t) => !t.dup).slice(0, s.max_dms_per_run);
  const review = reviewAll.slice(0, s.max_review_per_run);

  if (!live) {
    return json({
      mode: "dry", activePosts: byPost.size, errors,
      wouldDm: todo.map((t) => ({ user: t.username, text: t.text.slice(0, 30), campaign: t.campaign })),
      wouldSkipDuplicates: dups.length,
      wouldReview: review.map((r) => ({ user: r.username, text: r.text.slice(0, 50), type: r.type, campaign: r.campaign })),
    });
  }

  const out = { sent: 0, failed: 0, replyFailed: 0, review: 0, duplicates: 0, errors };
  const claim = async (row: any) => {
    const { data } = await db.from("ig_handled").upsert(row, { onConflict: "comment_id", ignoreDuplicates: true }).select("comment_id");
    return (data ?? []).length > 0;   // false = another run already has this comment
  };

  for (const t of dups) {
    if (await claim({ comment_id: t.commentId, campaign_name: t.campaign, post_id: t.postId, username: t.username, comment_text: t.text.slice(0, 60), result: "Skipped", error: "already sent a link on this post" })) out.duplicates++;
  }
  for (const t of todo) {
    if (!(await claim({ comment_id: t.commentId, campaign_name: t.campaign, post_id: t.postId, username: t.username, comment_text: t.text.slice(0, 60), result: "Pending" }))) continue;
    try {
      await graph("POST", `${s.page_id}/messages`, { recipient: JSON.stringify({ comment_id: t.commentId }), message: JSON.stringify({ text: t.dm }) }, s.page_token);
    } catch (e) {
      out.failed++;
      await db.from("ig_handled").update({ result: "Failed", error: (e instanceof Error ? e.message : String(e)).slice(0, 400), handled_at: new Date().toISOString() }).eq("comment_id", t.commentId);
      continue;
    }
    let replyOk = true;
    try { await graph("POST", `${t.commentId}/replies`, { message: t.reply }, s.page_token); } catch { replyOk = false; out.replyFailed++; }
    await db.from("ig_handled").update({ result: "Sent", public_reply_ok: replyOk, handled_at: new Date().toISOString() }).eq("comment_id", t.commentId);
    out.sent++;
  }
  for (const r of review) {
    if (!(await claim({ comment_id: r.commentId, campaign_name: r.campaign, post_id: r.postId, username: r.username, comment_text: r.text.slice(0, 60), result: "Skipped", error: "sent to Needs Reply for a person to answer" }))) continue;
    await db.from("ig_needs_reply").upsert({
      comment_id: r.commentId, campaign_name: r.campaign, post_link: r.postLink, username: r.username,
      comment_text: r.text.slice(0, 1000), commented_at: new Date(r.ts).toISOString(), type: r.type,
    }, { onConflict: "comment_id", ignoreDuplicates: true });
    out.review++;
  }

  if (out.sent || out.failed || out.review || out.duplicates || errors.length) await db.from("ig_run_log").insert({ job: "run", detail: out });
  return json({ activePosts: byPost.size, ...out });
});
