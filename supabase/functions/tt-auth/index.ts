import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// TikTok OAuth. Two routes:
//   GET /tt-auth          -> redirects the owner to TikTok's consent page
//   GET /tt-auth?code=... -> TikTok redirects back here; tokens are stored in tt_settings
// Secrets: TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET (set in Supabase, never in chat).
// Register this function's URL as the Redirect URI in the TikTok developer app.

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const KEY = Deno.env.get("TIKTOK_CLIENT_KEY");
const SECRET = Deno.env.get("TIKTOK_CLIENT_SECRET");
const REDIRECT = `${Deno.env.get("SUPABASE_URL")}/functions/v1/tt-auth`;
const SCOPES = "user.info.basic,video.list,comment.list,comment.list.manage";

const page = (msg: string, status = 200) =>
  new Response(`<!doctype html><meta charset=utf-8><body style="font-family:Arial;padding:40px"><h2>${msg}</h2>`, { status, headers: { "Content-Type": "text/html" } });

Deno.serve(async (req) => {
  if (!KEY || !SECRET) return page("TikTok keys are not set yet.", 500);
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) {
    const state = crypto.randomUUID();
    const q = new URLSearchParams({ client_key: KEY, scope: SCOPES, response_type: "code", redirect_uri: REDIRECT, state });
    return Response.redirect(`https://www.tiktok.com/v2/auth/authorize/?${q}`, 302);
  }
  const r = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_key: KEY, client_secret: SECRET, code, grant_type: "authorization_code", redirect_uri: REDIRECT }),
  });
  const t: any = await r.json().catch(() => ({}));
  if (!r.ok || !t.access_token) return page(`TikTok sign-in failed: ${t.error_description ?? t.error ?? r.status}`, 400);
  const now = Date.now();
  await db.from("tt_settings").update({
    open_id: t.open_id, access_token: t.access_token, refresh_token: t.refresh_token, scopes: t.scope,
    access_expires_at: new Date(now + (t.expires_in ?? 86400) * 1000).toISOString(),
    refresh_expires_at: new Date(now + (t.refresh_expires_in ?? 31536000) * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", 1);
  return page("TikTok connected. You can close this tab.");
});
