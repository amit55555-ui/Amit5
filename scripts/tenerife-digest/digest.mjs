// Daily Tenerife news digest.
//
// 1. Pulls Tenerife stories from the last 24h (Google News RSS + a few feeds).
// 2. Asks Claude to pick the most important ones and summarize them in Hebrew.
// 3. Creates a Gmail draft (via the Gmail REST API) addressed to the user.
//
// Designed to run from GitHub Actions on a daily schedule. Required env vars:
//   ANTHROPIC_API_KEY      - Claude API key
//   GMAIL_CLIENT_ID        - Google OAuth client id
//   GMAIL_CLIENT_SECRET    - Google OAuth client secret
//   GMAIL_REFRESH_TOKEN    - OAuth refresh token with gmail.compose scope
//   DIGEST_TO              - recipient email (e.g. amit55555@gmail.com)
// Optional:
//   ANTHROPIC_MODEL        - defaults to claude-opus-4-8

import Anthropic from "@anthropic-ai/sdk";
import Parser from "rss-parser";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
const TO = process.env.DIGEST_TO;
const MAX_ITEMS_TO_MODEL = 40; // headlines handed to Claude
const LOOKBACK_HOURS = 24;

// News sources. Google News RSS aggregates local Tenerife sites, Spanish expat
// outlets, and general coverage, so it does the heavy lifting; the direct feeds
// add redundancy. Any feed that fails is skipped, not fatal.
const FEEDS = [
  "https://news.google.com/rss/search?q=Tenerife%20when%3A1d&hl=en-GB&gl=GB&ceid=GB:en",
  "https://news.google.com/rss/search?q=Tenerife%20(weather%20OR%20flights%20OR%20tourism%20OR%20canary)%20when%3A1d&hl=en-GB&gl=GB&ceid=GB:en",
  "https://euroweeklynews.com/tag/tenerife/feed/",
  "https://www.theolivepress.es/spain-news/tenerife/feed/",
];

const parser = new Parser({ timeout: 20000 });

function withinLookback(item) {
  const ts = item.isoDate || item.pubDate;
  if (!ts) return true; // keep undated items; Claude can judge relevance
  const ageMs = Date.now() - new Date(ts).getTime();
  return Number.isNaN(ageMs) || ageMs <= LOOKBACK_HOURS * 3600 * 1000;
}

function cleanText(s) {
  return (s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function gatherArticles() {
  const seen = new Set();
  const articles = [];

  const results = await Promise.allSettled(FEEDS.map((url) => parser.parseURL(url)));
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const item of r.value.items || []) {
      if (!withinLookback(item)) continue;
      const link = (item.link || "").trim();
      const title = cleanText(item.title);
      if (!title || !link) continue;
      const key = title.toLowerCase().slice(0, 80);
      if (seen.has(key)) continue;
      seen.add(key);
      articles.push({
        title,
        link,
        source: cleanText(item.creator || item.source || (r.value.title ?? "")),
        date: item.isoDate || item.pubDate || "",
        snippet: cleanText(item.contentSnippet || item.content || "").slice(0, 300),
      });
    }
  }
  return articles.slice(0, MAX_ITEMS_TO_MODEL);
}

function todayLabel() {
  // DD/MM/YYYY in Israel time
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jerusalem",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

async function summarizeToHebrew(articles) {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY
  const dateStr = todayLabel();

  const list = articles
    .map(
      (a, i) =>
        `${i + 1}. ${a.title}\n   source: ${a.source || "?"} | date: ${a.date || "?"}\n   link: ${a.link}\n   ${a.snippet}`
    )
    .join("\n\n");

  const system =
    "You are an editor producing a daily Hebrew-language news digest about Tenerife " +
    "for an Israeli reader. You receive English headlines and write concise, factual " +
    "Hebrew summaries. Never invent facts not present in the provided material.";

  const userPrompt = `Today is ${dateStr}. Below are English-language news items about Tenerife from roughly the last 24 hours (some may be off-topic or duplicates).

Pick the 3–5 MOST important Tenerife stories of the day (prioritize: weather warnings, transport/flights, safety/incidents, tourism rules, local government, major events). Drop duplicates, generic Spain-wide items unrelated to Tenerife, and filler.

Then output an HTML email body in HEBREW with this exact structure and nothing else (no markdown, no code fences):

<div dir="rtl" style="font-family: Arial, sans-serif; line-height:1.6;">
<p>סיכום החדשות החשובות מטנריף ל-${dateStr} — N ידיעות:</p>
<!-- for each selected story: -->
<h3 style="margin:18px 0 4px;">כותרת בעברית</h3>
<p>סיכום בעברית של 2–3 משפטים.</p>
<p style="font-size:13px;color:#555;">מקור: <a href="ORIGINAL_LINK">שם המקור</a></p>
</div>

Replace N with the actual number of stories. If there is genuinely no notable Tenerife news today, return the wrapper div with a single Hebrew paragraph saying so. Output only the HTML.

News items:
${list}`;

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    system,
    messages: [{ role: "user", content: userPrompt }],
  });

  const html = resp.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  if (!html) throw new Error("Empty summary from model");
  return { html, dateStr };
}

// --- Gmail draft creation via REST (no SDK dependency) ---

async function gmailAccessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID,
      client_secret: process.env.GMAIL_CLIENT_SECRET,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.access_token;
}

function base64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildMime({ to, subject, html }) {
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
  const lines = [
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(html, "utf8").toString("base64"),
  ];
  return lines.join("\r\n");
}

async function createDraft({ to, subject, html }) {
  const token = await gmailAccessToken();
  const raw = base64url(buildMime({ to, subject, html }));
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: { raw } }),
  });
  if (!res.ok) throw new Error(`Draft creation failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  for (const key of ["ANTHROPIC_API_KEY", "GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN", "DIGEST_TO"]) {
    if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
  }

  console.log("Gathering Tenerife articles...");
  const articles = await gatherArticles();
  console.log(`Collected ${articles.length} candidate articles.`);
  if (articles.length === 0) {
    console.log("No articles found; skipping draft creation.");
    return;
  }

  console.log(`Summarizing with ${MODEL}...`);
  const { html, dateStr } = await summarizeToHebrew(articles);

  console.log("Creating Gmail draft...");
  const draft = await createDraft({
    to: TO,
    subject: `דייג'סט טנריף – ${dateStr}`,
    html,
  });
  console.log(`Draft created: ${draft.id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
