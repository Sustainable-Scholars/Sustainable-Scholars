---
name: matchmaking-pdf-template
description: The approved PDF template and email for the Sustainable Scholars matchmaking (Success Circle) emails: charcoal and antique-gold ticket-stub layout with the crest logo top right, top-3 scholarship boxes linked to the site, a green booking button, and the approved email body. Use when building, editing, testing or re-rendering the matchmaking PDF or email, or when asked to "use the template" or change the look of the top-3 scholarship sheet.
---

# Matchmaking PDF template (approved design)

This is the standard look for the top-3 scholarship PDF sent with the "Congratulations, You've Been Matched!!" email. Treat it as the template for every send. Change it only when the user asks.

Reference render: `reference-render.png` in this folder (Kamren Thomas, sample picks).

## Where the live code is
- Function: `supabase/functions/mm-run/index.ts` (Supabase project `jbqzuzuloxxnzjrbehgr`, function `mm-run`, `verify_jwt` false, called with the `x-cron-secret` header).
- PDF builder: `buildPdf()`. Email: `composeEmail()`. Logo: `crestPng()` (fetches the logo from the public `public-assets` bucket, crops it above its wording, puts it in a white circle, and returns a PNG).
- Settings row `mm_settings` (id 1) controls mode: `dry` (default, writes nothing), `test` (sends only to `owner_email`, subject prefixed `[TEST for ...]`), `live` (sends to the student). Keep it at `dry` and `enabled = false` unless the user approves going live.

## Layout (top to bottom, 612 x 792 pt page)
1. Charcoal page (#1B1C1F) with a double antique-gold frame (outer 1.2 pt, inner 0.5 pt).
2. Top right: the crest in a white circle, 66 pt square, bottom edge on the baseline of the heading (y = 138 from top), right edge at x = 552.
3. Header, left aligned at x = 60: eyebrow "SUSTAINABLE SCHOLARS" (gold, bold 8 pt, baseline 66); student name (italic 20 pt, white, baseline 98); "Top 3 Scholarships" (bold serif 32 pt, gold, baseline 138); thin gold rule at 149.
4. Three ticket-stub boxes at tops 162, 312, 462 (142 pt tall, 492 pt wide). Each has notches top and bottom at the perforation, a dashed perforation, and a left stub with "PICK" and the rank number "#1/#2/#3" (46 pt). Below the rank, "VIEW SCHOLARSHIP >" is a clickable link to the site page.
   - Body text: scholarship name (bold serif), then "institution  ·  award" (sans, grey), then the fit description (serif). One type size is chosen for all three boxes: the largest sizes that fit every box, so the set matches. Text is never truncated.
   - Optional tag, e.g. "CLOSE TO HOME", appears after "SCHOLARSHIP" in the label.
5. Call to action: heading "Next Steps: A Complementary Scholarship Strategy Session" (bold serif 17 pt, white), subline "Meet with our team to see if you're a fit for The Success Circle." (10.5 pt), then one bright green button "BOOK YOUR SESSION" (#38DB6B, dark text), linked to sustainable-scholars.org/book-call.
6. Footer: the booking URL printed in gold at left (clickable), and "Verify eligibility and deadlines on each official page." in grey at right.

## Email (approved, do not change without the user)
- Subject: `Congratulations, You’ve Been Matched!!` (curly apostrophe).
- Body: copied from the approved Outlook draft: greeting, Match Making Form thank-you, The Success Circle paragraph with the three bullets, "reply with the word CIRCLE", signature for Cameron Cary, Sustainable Scholars Founder, tagline, and "Click Here for More Information" link. The body does not list scholarships. The PDF is the only attachment, named `First_Last_Top_3_Scholarships.pdf`.

## Content rules
- Every scholarship shown must exist and be active in Supabase (`institutional_scholarships` or `scholarship_programs`). The function checks this before picking.
- Top 3 must include at least one institutional scholarship, and all three must be open to date (`days_left >= 0`).
- Students need grade 11th or 12th and GPA above 3.5. No GPA goes to review.
- Only the picks' own text is used. Do not type scholarship copy by hand.

## How to test without emailing students
1. Set `mm_settings` to `mode = 'test'`, `enabled = true`.
2. POST to the function with `x-cron-secret` and body `{"test_design": {"first", "last", "email", "picks": [{name, institution, award_amount, description, sb_table, sb_id, tag?}]}}`. The PDF and email go only to `owner_email`.
3. Restore `mode = 'dry'`, `enabled = false`, and `go_live_after` to its saved value.
4. To check layout without deploying, copy the segment between `// ---------- PDF attachment` and `// ---------- Email` into a local script with `pdf-lib`, render it, and convert with `pdftoppm`.

## Notes
- The image library used before does not load in the Supabase runtime. The crest uses a small built-in PNG decoder and encoder (`decodePngRGBA`, `pngFromRGBA`). Keep it that way.
- The crest is fetched at send time. If the logo is missing or fetch fails, the PDF sends without it.
- Go-live steps and dry-run checks are in `meeting-reminder-emails` for the reminder system; this skill covers the matchmaking PDF and email only.

## Two email tracks (added Nov 20)
Both tracks attach the same top-3 PDF. `mm-run` picks the track per intake:
- **circle**: grade 11th/12th and GPA >= `mm_settings.min_gpa` (3.3). Success Circle invitation email.
- **general**: everyone else (other grades, GPA below the cutoff, or no GPA). "We Received Your Match Making Form" email: "Hello {first name}," a link to the 10,000+ scholarship database, and a green BOOK A CALL button to /book-call.
First names are capitalised in both emails. `test_design` (with `track: "general"` or `"circle"`) sends a preview to owner_email only, in any mode.

The Success Circle email no longer asks students to reply with the word CIRCLE. It ends with "To determine if you meet the eligibility requirements for the program, click the link below to book a call with a member of our team so we can learn more about your passions and aspirations." and the same green BOOK A CALL button (BOOK_BTN) used in the general email.
