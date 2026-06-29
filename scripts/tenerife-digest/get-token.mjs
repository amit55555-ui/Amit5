// One-time helper to obtain a Gmail refresh token for the digest.
//
// Prereqs (Google Cloud Console, one time):
//   1. Create/select a project, enable the "Gmail API".
//   2. Configure the OAuth consent screen (External, add yourself as a test user).
//   3. Create an OAuth client of type "Desktop app".
//   4. Note its Client ID and Client secret.
//
// Run locally (NOT in CI):
//   GMAIL_CLIENT_ID=xxx GMAIL_CLIENT_SECRET=yyy node get-token.mjs
//
// It opens a local callback server, prints an authorization URL, and after you
// approve in the browser it prints the GMAIL_REFRESH_TOKEN to store as a secret.

import http from "node:http";

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const PORT = 5555;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const SCOPE = "https://www.googleapis.com/auth/gmail.compose";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in the environment first.");
  process.exit(1);
}

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
  });

console.log("\n1) Open this URL in your browser and approve access:\n");
console.log(authUrl + "\n");

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith("/callback")) {
    res.writeHead(404).end();
    return;
  }
  const code = new URL(req.url, REDIRECT_URI).searchParams.get("code");
  if (!code) {
    res.writeHead(400).end("No code");
    return;
  }
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    const json = await tokenRes.json();
    if (!json.refresh_token) {
      res.writeHead(500).end("No refresh_token returned. Revoke prior access and retry with prompt=consent.");
      console.error("Response:", json);
      server.close();
      return;
    }
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" })
      .end("Done. You can close this tab and return to the terminal.");
    console.log("\n2) Store this as the GMAIL_REFRESH_TOKEN secret:\n");
    console.log(json.refresh_token + "\n");
  } catch (e) {
    res.writeHead(500).end("Token exchange failed");
    console.error(e);
  } finally {
    server.close();
  }
});

server.listen(PORT, () => console.log(`Waiting for the OAuth redirect on ${REDIRECT_URI} ...`));
