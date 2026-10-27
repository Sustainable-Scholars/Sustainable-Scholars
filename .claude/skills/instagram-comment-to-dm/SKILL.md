---
name: instagram-comment-to-dm
description: Set up, run and troubleshoot an Instagram "comment a keyword, get a DM with a link" automation on the free tier of Activepieces, and fix the errors that block it (empty Page list, "You don't have any Pages", "The account owner has disabled access to instagram direct messages"). Use when connecting Instagram to Activepieces, adding a new keyword campaign, or debugging a comment-to-DM flow.
---

# Instagram comment-to-DM (Activepieces)

Built and verified live on 2026-10-27 for @sustainable__scholars. A commenter who writes a keyword
(MILES, MOREHOUSE, HOWARD...) on a post gets a DM with a link, plus a public "check your DMs" reply.

## When to use
- Connecting an Instagram account to Activepieces for the first time.
- Adding a new post or keyword to the existing automation.
- Anything in the troubleshooting table below.

## How it works
One master flow, driven by a table, so a new post means one new row and no new flow.
- **Activepieces folder** "Instagram Comment-to-DM", flow "Instagram Comment-to-DM (master)".
- **Table `Campaigns`**: Campaign Name, Keyword, Post ID (Instagram media id), Post Link, DM Message,
  Link To Send, Status (Active / Paused / Ended), Ends On. (A `DMs Sent` column exists but is unused.)
- **Table `Handled Comments`**: Comment ID, Campaign Name, Username, Comment Text, Handled At,
  Result (Sent / Failed / Skipped), Error. Used for de-duplication and an audit trail.
- **Flow, every 15 minutes:** get campaigns, get handled comments, one CODE step finds new matches,
  then a loop sends the DM (Instagram "Send Private Reply"), replies publicly, and logs the result.
  A failed DM is logged as Failed and the public reply is skipped (the DM step uses continue-on-failure
  with On success / On failure branches, so one bad comment never blocks the queue).
- The CODE step reads the comments with the Graph API using the Instagram connection's token, via the
  expression `{{connections['<connection externalId>']}}` and its `access_token`. It never logs the token.

## Matching rules chosen by the owner
- Keyword anywhere in the comment, any capitalization.
- Skip comments containing a question mark (a person should answer those).
- Skip the account's own comments and hidden comments.
- One DM per person per post. Oldest comment first. Max 8 per run so a backlog drains gradually.
- Ignore comments older than 6.8 days (Instagram allows a private reply for 7 days, once per comment).
- DM text: "Thank you for your interest in Sustainable Scholars, here is your link😊: <link>".
  The link is a plain URL (Instagram DMs cannot hold hyperlink text; the URL is tappable by itself).
- Public reply picks one of three variations at random.

## Prerequisites checklist (all of these were needed)
1. Instagram account is **Professional** (Business or Creator).
2. It is **linked to a Facebook Page**, and the Facebook profile used to connect **manages that Page
   directly** (check Page > Settings > Page access).
3. A free **Meta developer app** (developers.facebook.com): use case "Other", app type "Business".
   Stay in **Development** mode; it works for the app admin's own accounts. Do not request
   advanced access or app review. Add `https://cloud.activepieces.com/redirect` as a Valid OAuth
   Redirect URI. Use the **Facebook** App ID and App Secret (App settings > Basic), not the
   "Instagram app ID/secret" from the Instagram product page.
4. In the Instagram app: **Allow access to messages** is ON (see troubleshooting).

## Connect Instagram in Activepieces
1. Settings > Connections > New Connection > Instagram for Business.
2. Client ID = Facebook App ID, Client Secret = App Secret (type it only into that box).
3. In the Facebook window: continue as the right profile, then choose Pages (tick the Page), Businesses
   (none is needed), Instagram accounts (tick the account). Leave every permission on.
4. Check it: the `page` dropdown of any Instagram action must list the Page. An empty list means the
   connection cannot see a Page (see the first rows below).

## Troubleshooting (symptom, cause, fix)
| Symptom | Cause | Fix |
|---|---|---|
| Activepieces says "connection is working" but the `page` dropdown is empty | The saved sign-in is still valid, so "Reconnect" never re-asks Facebook which Page to share | Delete the Instagram connection, create a new one, and answer Facebook's Page/Instagram questions again. Also remove the app under facebook.com > Settings > Business Integrations first if Facebook skips the questions |
| Facebook window says "You don't have any Pages / Businesses / Instagram accounts" | The Facebook profile signing in manages no Page, or Instagram is linked to a different profile | In Instagram: Edit profile > Page (create or connect one). Make sure the profile you sign in with is an admin with full control of the Page. Check Settings > Accounts Center |
| Meta shows "Facebook Login for Business requires advanced access" | That product wants app review | Ignore it. Do not click Get Advanced Access. Development mode is enough for your own account |
| Meta refuses to make the app Live: "Invalid Privacy Policy URL" | Live mode needs a real privacy policy URL | Not needed. Stay in Development. If Live is ever needed, set the URL in App settings > Basic |
| Redirect error when connecting | Strict mode is on and the redirect URI is missing | Add `https://cloud.activepieces.com/redirect` under Valid OAuth Redirect URIs |
| **DM step fails: `(#200) The account owner has disabled access to instagram direct messages` (subcode 2534041)** | Instagram's **Allow access to messages** switch is OFF for the business account | In the Instagram app: Settings and activity > Messages and story replies > **Message requests** > **Connected tools** > turn on **Allow access to messages**. It was NOT under "Message controls" or in the search for "connected tools" in the 2026 app, and not in the Facebook Page's Linked accounts screens. Closing and reopening the app helps if the switch looks locked. Then retry |
| After a failed attempt the comment is never retried | The Failed row in `Handled Comments` marks that comment as handled | Delete that row, then re-run |

## Testing before going live (do this every time the setup changes)
1. Set all real campaigns to **Paused**; add a temporary campaign (keyword like TESTDM) on any recent post.
2. Comment the keyword from a second Instagram account.
3. Run the flow once (Activepieces test). Confirm: DM arrives (check the second account's message
   requests), public reply appears, row is logged as Sent.
4. Delete the test campaign and the test rows, set real campaigns back to Active, then publish.
A test run uses the real API: it really sends. Never test with real campaigns active unless you mean to.

## Limits and costs
- Instagram: one private reply per comment, within 7 days; DM replies to a user's message within 24 hours;
  100 API posts per 24 hours.
- Activepieces free plan: an idle run is about 4 steps (about 11,000 a month at 15 minutes). Check the plan
  allowance before publishing; lengthen the interval or move to a webhook-based setup if it is tight.
- The two Instagram steps store the Page access key inside the step. If the connection is deleted and
  recreated later, refresh that value in those steps.

## Notes
- The matching CODE step is easy to extend (new rules, other keywords). Keep one row per post in `Campaigns`.
- Lessons about process: stop and check the actual Facebook/Instagram screens before assuming a menu path,
  since Meta renames and moves settings often; never paste the App Secret or access tokens into chat.
