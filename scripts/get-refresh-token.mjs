// סקריפט חד-פעמי להשגת GOOGLE_REFRESH_TOKEN.
//
// שימוש:
//   1. צרו OAuth Client מסוג "Desktop app" ב-Google Cloud (ראו SETUP.md)
//   2. הריצו:  GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy node scripts/get-refresh-token.mjs
//   3. פתחו את הקישור שמודפס, אשרו, והעתיקו את הקוד חזרה לטרמינל
//   4. ה-refresh token יודפס – הכניסו אותו ל-.env.local

import { google } from 'googleapis';
import readline from 'node:readline';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('חסר GOOGLE_CLIENT_ID או GOOGLE_CLIENT_SECRET בסביבה.');
  process.exit(1);
}

// 'urn:ietf:wg:oauth:2.0:oob' הוצא משימוש – משתמשים ב-localhost ידני
const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, 'http://localhost');

const url = oauth2.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent', // מבטיח קבלת refresh_token
  scope: ['https://www.googleapis.com/auth/calendar'],
});

console.log('\n1) פתחו בדפדפן את הקישור הבא ואשרו:\n');
console.log(url);
console.log(
  '\n2) הדפדפן יופנה ל-http://localhost/?code=... (ייתכן "האתר לא נגיש" – זה תקין).',
);
console.log('   העתיקו מה-URL את הערך שאחרי code= (עד ה-&), והדביקו כאן:\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('code: ', async (code) => {
  rl.close();
  try {
    const { tokens } = await oauth2.getToken(decodeURIComponent(code.trim()));
    if (!tokens.refresh_token) {
      console.error(
        '\nלא התקבל refresh_token. הסירו את ההרשאה הקיימת ב-https://myaccount.google.com/permissions ונסו שוב.',
      );
      process.exit(1);
    }
    console.log('\n✅ הוסיפו ל-.env.local את השורה:\n');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
  } catch (err) {
    console.error('\nשגיאה בהחלפת הקוד:', err.message);
    process.exit(1);
  }
});
