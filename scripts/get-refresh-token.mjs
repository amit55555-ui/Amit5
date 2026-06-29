// ===== קבלת Refresh Token ל-Gmail (הרצה חד-פעמית) =====
// שימוש:
//   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... node scripts/get-refresh-token.mjs
// פותח קישור הרשאה, מבקשים אישור, מדביקים את הקוד שחוזר, ומקבלים refresh token.

import { google } from 'googleapis';
import readline from 'node:readline';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('חסר GOOGLE_CLIENT_ID או GOOGLE_CLIENT_SECRET בסביבה.');
  process.exit(1);
}

// OOB flow – מתאים לסקריפט מקומי
const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, 'urn:ietf:wg:oauth:2.0:oob');

const url = oauth2.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/gmail.send'],
});

console.log('\n1) פתחו את הקישור הבא בדפדפן והתחברו עם חשבון הוועד:\n');
console.log(url);
console.log('\n2) אשרו את ההרשאה והדביקו כאן את הקוד שמתקבל:\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('קוד: ', async (code) => {
  rl.close();
  try {
    const { tokens } = await oauth2.getToken(code.trim());
    console.log('\n✅ הצליח! הוסיפו את השורה הבאה ל-.env.local:\n');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
  } catch (err) {
    console.error('שגיאה בקבלת הטוקן:', err?.message || err);
    process.exit(1);
  }
});
