---
name: tenerife-news-digest
description: Collects the most important Tenerife news from the past week plus upcoming events in the week ahead from English-language news sites, summarizes them in Hebrew, and prepares a Gmail draft addressed to the user. Use when the user asks to run the Tenerife digest, get Tenerife news in Hebrew, or "הרץ דייג'סט טנריף".
---

# Tenerife News Digest (Hebrew)

Build a daily digest of the most important Tenerife news, written in Hebrew, and
create a Gmail draft the user can review and send.

## Recipient

Send to the user's email. Default: `amit55555@gmail.com` (override if the user
gives another address).

## Steps

1. **Gather** — find Tenerife coverage from the **last 7 days**, plus anything
   about **upcoming events in the week ahead** (festivals, strikes, closures,
   weather warnings, new rules, schedule changes). Run a few `WebSearch` queries
   and prefer these source families:
   - Local Tenerife / Canary Islands sites: Canarian Weekly, Tenerife Weekly,
     Canarian Daily, Tenerife News.
   - English-language Spain / expat outlets: Euro Weekly News, Olive Press,
     The Local Spain.
   - A general `Tenerife news` web search to catch anything the above miss.

   Suggested queries:
   - `Tenerife news this week`
   - `Tenerife Canary Islands latest news`
   - `Tenerife events OR festival OR strike OR closure upcoming week`

2. **Read** — `WebFetch` the most promising 6–10 articles to confirm they are
   real, recent (last 7 days) or genuinely upcoming, and actually about Tenerife
   (not generic Spain or other Canary islands unless notable).

3. **Select** — pick the **5–7 most important** items, covering both notable news
   from the past week AND upcoming events in the week ahead. Prioritize: weather
   warnings, transport/flights, safety/incidents, tourism rules, local government
   decisions, and major events. For forward-looking items, include the date.
   Drop duplicates and fluff.

4. **Summarize in Hebrew** — for each selected item write:
   - A short Hebrew headline (כותרת).
   - A 2–3 sentence Hebrew summary (סיכום) of what happened / what's coming and
     why it matters. For an upcoming event, include the relevant date.
   - The source name and a link to the original English article.

   Open with one Hebrew line noting it covers the past week and upcoming events,
   today's date, and how many items follow. If there is genuinely nothing notable,
   say so plainly in Hebrew instead of padding.

5. **Create the draft** — call `mcp__Gmail__create_draft` with:
   - `to`: the recipient email.
   - `subject`: `דייג'סט טנריף – <DD/MM/YYYY>` (today's date).
   - `htmlBody`: the Hebrew digest as clean RTL HTML (wrap the body in
     `<div dir="rtl" style="font-family: Arial, sans-serif;">…</div>`; each story
     as a heading + paragraph + source link).
   - `body`: a plain-text Hebrew version as fallback.

   Tell the user the draft is ready in Gmail for review before they send it.

## Notes

- This skill prepares a **draft** — it does not send mail. The user sends it.
- Keep summaries factual; do not invent details not present in the sources.
- The automated daily version of this digest runs via GitHub Actions
  (`.github/workflows/tenerife-digest.yml`) and emails the user directly; this
  skill is the on-demand version you run from Claude Code.
