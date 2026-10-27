---
name: instagram-comment-to-dm
description: Set up, run, extend and troubleshoot the Sustainable Scholars Instagram automation on the free tier of Activepieces. A commenter who writes a post's keyword gets a DM with a link; every other comment on a campaign post is collected in a Needs Reply table and emailed once a day for a person to answer. Also fixes the errors that block it (empty Page list, "You don't have any Pages", "The account owner has disabled access to instagram direct messages"). Use when connecting Instagram to Activepieces, adding a campaign, changing the matching rules or digest, or debugging either flow.
---

# Instagram comment-to-DM and Needs Reply digest (Activepieces)

Built and verified live on 2026-10-27 for @sustainable__scholars. Go-live result: 4 runs, 21 DMs sent
with public replies, 0 failures. Everything below was tested against the real account.

## When to use
- Connecting an Instagram account to Activepieces for the first time.
- Adding a new post or keyword (one new row, no new flow).
- Changing matching rules, the DM text, or the daily email.
- Anything in the troubleshooting tables.

## How it works
Two flows in the Activepieces folder "Instagram Comment-to-DM" (project "Sustainable's Project"),
driven by three tables so new posts need data, not new flows.

**Tables**
- `Campaigns`: Campaign Name, Keyword, Post ID (Instagram media id), Post Link, DM Message,
  Link To Send, Status (Active / Paused / Ended), Ends On. (`DMs Sent` exists but is unused.)
- `Handled Comments`: Comment ID, Campaign Name, Username, Comment Text, Handled At,
  Result (Sent / Failed / Skipped), Error. De-duplication and audit trail. Comments sent to review get a
  `Skipped` marker row here so they are never logged twice (this keeps idle runs to one table read).
- `Needs Reply`: Comment ID, Campaign Name, Post Link, Username, Comment Text, Commented At,
  Type (Question / Other), Status (New / Emailed / Replied / Ignored), Emailed At, My Reply Notes.

**Flow 1: "Instagram Comment-to-DM (master)", every 15 minutes**
get campaigns, get handled comments, one CODE step reads the comments of each Active campaign post
through the Graph API (token from `{{connections['<externalId>']}}`, field `access_token`, never logged),
then loop 1 sends the DMs and loop 2 logs comments for review.
- Loop 1 per person: Instagram "Send Private Reply" (continue-on-failure). On success: public reply under
  the comment, then log Sent. On failure: log Failed with the error and skip the public reply, so one bad
  comment never blocks the queue.
- Loop 2 per review item: add a row to `Needs Reply`, then a `Skipped` marker row in `Handled Comments`.

**Flow 2: "Instagram Needs Reply: daily email summary", every day 8 AM America/New_York, weekends included**
Get `Needs Reply` rows, a CODE step builds an HTML summary of rows with Status New (grouped by campaign:
when in ET, @user, type, comment, link to the post), loop over a 0-or-1 item list so nothing happens when
there is nothing new, send it with Outlook (info@sustainable-scholars.org to itself), then mark each row
Emailed with a timestamp. The email tells the owner to reply by email or in Claude.

## Matching rules chosen by the owner
- Keyword anywhere in the comment, any capitalization.
- A comment is a **question** if it has a "?" or starts with how, what, when, where, why, who, which,
  is, are, do, does, did, can, could, will, would, should. Questions are never DM'd, even with the keyword.
- Anything that is not a plain keyword request goes to `Needs Reply` (last 14 days, max 40 per run):
  questions, off-topic comments, and keyword comments that are questions. Nothing is ever sent to Instagram
  for these. The owner decides the answer; Claude drafts the wording and walks them through posting it
  on Instagram.
- Skip the account's own comments and hidden comments.
- One DM per person per campaign post, oldest first, max 8 DMs per run so a backlog drains gradually.
- Ignore keyword comments older than 6.8 days (Instagram allows a private reply for 7 days, once per comment).
- DM text: "Thank you for your interest in Sustainable Scholars, here is your link😊: <link>".
  The link is a plain URL (Instagram DMs cannot hold hyperlink text; the URL is tappable by itself).
- Public reply picks one of three variations at random.

## Prerequisites checklist (all were needed)
1. Instagram account is **Professional** (Business or Creator).
2. Linked to a **Facebook Page**, and the Facebook profile used to connect **manages that Page directly**
   (Page > Settings > Page access).
3. A free **Meta developer app**: use case "Other", type "Business". Stay in **Development** mode (works for
   the admin's own accounts). Do not request advanced access or app review. Add
   `https://cloud.activepieces.com/redirect` as a Valid OAuth Redirect URI. Use the **Facebook** App ID and
   App Secret (App settings > Basic), not the "Instagram app ID/secret".
4. In the Instagram app: **Allow access to messages** ON (see troubleshooting).

## Connect Instagram in Activepieces
1. Settings > Connections > New Connection > Instagram for Business.
2. Client ID = Facebook App ID, Client Secret = App Secret (type it only into that box, never in chat).
3. In the Facebook window: continue as the right profile, tick the Page, skip Businesses, tick the Instagram
   account, leave every permission on.
4. Check: the `page` dropdown of any Instagram action must list the Page. Empty means no Page access.

## Troubleshooting: Instagram and Meta
| Symptom | Cause | Fix |
|---|---|---|
| Activepieces says "connection is working" but the `page` dropdown is empty | The saved sign-in is still valid, so "Reconnect" never re-asks Facebook which Page to share | Delete the Instagram connection and create a new one. If Facebook skips its questions, first remove the app under facebook.com > Settings > Business Integrations |
| Facebook window says "You don't have any Pages / Businesses / Instagram accounts" | The signing-in profile manages no Page, or Instagram is linked to another profile | Instagram: Edit profile > Page (create or connect one). Make that Facebook profile an admin with full control of the Page. Check Accounts Center |
| Meta: "Facebook Login for Business requires advanced access" | That product wants app review | Ignore. Do not click Get Advanced Access |
| Meta refuses Live mode: "Invalid Privacy Policy URL" | Live needs a real privacy policy URL | Not needed. Stay in Development |
| Redirect error when connecting | Strict mode on, redirect URI missing | Add `https://cloud.activepieces.com/redirect` under Valid OAuth Redirect URIs |
| **DM step fails: `(#200) The account owner has disabled access to instagram direct messages` (subcode 2534041)** | Instagram's **Allow access to messages** switch is OFF | Instagram app: Settings and activity > Messages and story replies > **Message requests** > **Connected tools** > **Allow access to messages** ON. It was NOT under "Message controls", not in the search for "connected tools", and not in the Facebook Page's Linked accounts screens. If it looks locked, fully close and reopen the app |
| After a failed attempt the comment is never retried | The Failed row in `Handled Comments` marks it handled | Delete that row, then re-run |

## Troubleshooting: building and testing in Activepieces
| Symptom | Cause | Fix |
|---|---|---|
| Testing one step alone gives empty or wrong inputs (e.g. `.map is not a function`) | Isolated step tests do not carry earlier steps' output | Preview with a full flow test instead. To avoid side effects, temporarily set `skip: true` on the sending/writing steps, run the test, read the run output, then un-skip |
| A flow test "sends for real" | Test runs use the real APIs | Never test with real campaigns Active unless you mean to send. Pause them and use a TEST campaign |
| Edits to a published flow do nothing live | Edits change the draft only | Re-publish (lock and publish) after testing |
| Outlook "Send Email" step shows invalid when built inside the flow | The connection was placed inside `input` | Pass the connection as the step's separate `auth` field |
| Table update step ignores field names | Its `values` are keyed by the field **externalId** | Resolve the `values` options for the table to get the ids. Create-records can take a `records` JSON keyed by field **name** with `values: {}` |
| Instagram actions fail to run through the helper | `input` must be present even when empty, and the `page` value is an object (id, pageId, accessToken) taken from the dropdown | Pass `input: {}` for no-arg actions; resolve the `page` option first. The Page access key is stored inside the Instagram steps; refresh them if the connection is recreated |
| Table `table_id` in steps | Needs the table's **externalId**, not its id | Use `externalId` from the table list |

## Testing before going live (do this whenever the setup changes)
1. Pause all real campaigns; add a temporary campaign (keyword like TESTDM) on any recent post.
2. Comment the keyword from a second Instagram account.
3. Run the flow once. Confirm: DM arrives (check the second account's message requests), public reply
   appears, row logged as Sent.
4. Delete the test campaign and the test rows, set real campaigns back to Active, publish.

## Limits and costs
- Instagram: one private reply per comment within 7 days; DM replies to a user's message within 24 hours;
  100 API posts per 24 hours.
- Activepieces free plan: an idle comment run is about 4 steps (about 11,000 a month at 15 minutes);
  the daily email adds a handful of steps a day. Check the plan's allowance; lengthen the interval or move
  to a webhook-based design if it is tight.
- Both flows add little cost when nothing is new, because loops over empty lists do nothing.

## Process notes
- Check the actual Facebook/Instagram screens before assuming a menu path; Meta renames and moves settings.
- Never paste the App Secret or access tokens into chat.
- Before publishing anything that messages real people, get an explicit go-ahead and test with a second account.
- Report outcomes from the run logs, not from memory; if a step was not done, say so.
