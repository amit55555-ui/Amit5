# Tenerife News Digest (Hebrew)

Every day, this collects the most important Tenerife news from English-language
news sites, summarizes the top stories in **Hebrew**, and saves a **Gmail draft**
addressed to you. You open Gmail, review, and hit send.

Two ways to run it:

| Mode | How | Email behavior | Setup |
|------|-----|----------------|-------|
| **Automatic (daily)** | GitHub Actions, `.github/workflows/tenerife-digest.yml` | Creates a Gmail draft each morning | Secrets below |
| **On-demand** | The `tenerife-news-digest` skill inside Claude Code | Creates a Gmail draft now | None (uses the live Gmail connection) |

## How it works

`digest.mjs`:
1. Pulls Tenerife stories from the **last 7 days** (Google News RSS, which
   aggregates local Tenerife sites, Spanish expat outlets, and general coverage,
   plus a few direct feeds).
2. Sends the headlines to Claude (`claude-opus-4-8`), which selects the 5–7 most
   important items — both notable news from the past week and **upcoming events
   in the week ahead** — and writes Hebrew summaries as an RTL HTML email body.
3. Creates a Gmail draft via the Gmail REST API.

## One-time setup

### 1. Anthropic API key
Create a key at the Claude Console and store it as the `ANTHROPIC_API_KEY` secret.

### 2. Gmail OAuth (so the cloud job can create a draft in your Gmail)
GitHub Actions can't use a desktop Gmail login, so it authenticates with an OAuth
refresh token:

1. In Google Cloud Console: create a project, enable the **Gmail API**, configure
   the **OAuth consent screen** (External; add your Gmail as a test user), and
   create an OAuth client of type **Desktop app**. Note the Client ID and secret.
2. Locally, get a refresh token:
   ```bash
   cd scripts/tenerife-digest
   GMAIL_CLIENT_ID=xxx GMAIL_CLIENT_SECRET=yyy node get-token.mjs
   ```
   Open the printed URL, approve, and copy the refresh token it prints.

### 3. Add GitHub repository secrets
Settings → Secrets and variables → Actions → **New repository secret**:

| Secret | Value |
|--------|-------|
| `ANTHROPIC_API_KEY` | your Claude API key |
| `GMAIL_CLIENT_ID` | OAuth client id |
| `GMAIL_CLIENT_SECRET` | OAuth client secret |
| `GMAIL_REFRESH_TOKEN` | from `get-token.mjs` |
| `DIGEST_TO` | `amit55555@gmail.com` |

### 4. Test it
Actions tab → **Tenerife News Digest** → **Run workflow**. Check Gmail drafts.

## Run locally

```bash
cd scripts/tenerife-digest
npm install
ANTHROPIC_API_KEY=... GMAIL_CLIENT_ID=... GMAIL_CLIENT_SECRET=... \
GMAIL_REFRESH_TOKEN=... DIGEST_TO=amit55555@gmail.com npm run digest
```

## Notes

- The job **creates a draft**, it does not auto-send. You stay in control.
- Schedule is 06:07 UTC (~08:07/09:07 Israel; GitHub cron is UTC and not
  DST-aware). Change the `cron` line in the workflow to adjust.
- The OAuth scope is `gmail.compose` (create drafts only) — minimal access.
