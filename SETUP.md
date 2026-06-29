# חיבור האפליקציה ליומן Google של הספר

ברירת המחדל של האפליקציה היא **מצב דמו** — תורים נשמרים בדפדפן בלבד
(localStorage), בלי שרת ובלי מיילים. זה מספיק כדי לראות ולבדוק את הזרימה.

כדי שזה יעבוד **באמת** — כל תור נכנס ליומן Google שלך, הלקוח מקבל מייל
אישור/ביטול אוטומטי, והזמינות נקבעת לפי היומן — צריך חיבור חד-פעמי לחשבון
Google. זה לוקח כ-10 דקות.

> חשבון Gmail רגיל (לא Workspace) עובד מצוין עם השיטה הזו (OAuth + refresh
> token). אין צורך ב-Service Account.

---

## שלב 1 — פרויקט והפעלת Calendar API

1. היכנסו ל-<https://console.cloud.google.com/> והתחברו עם החשבון של המספרה.
2. צרו פרויקט חדש (למעלה משמאל → *New Project*).
3. חיפוש "Google Calendar API" → **Enable**.

## שלב 2 — מסך הסכמה (OAuth consent screen)

1. תפריט → *APIs & Services* → *OAuth consent screen*.
2. בחרו **External**, מלאו שם אפליקציה ואימייל, שמרו.
3. תחת *Test users* הוסיפו את כתובת ה-Gmail שלכם.
   (במצב Testing זה מספיק — לא צריך לפרסם את האפליקציה.)

## שלב 3 — יצירת OAuth Client

1. *APIs & Services* → *Credentials* → *Create Credentials* → *OAuth client ID*.
2. *Application type*: **Desktop app**. תנו שם, צרו.
3. העתיקו את **Client ID** ואת **Client secret**.

## שלב 4 — השגת Refresh Token

מהתיקייה של הפרויקט הריצו (החליפו בערכים שלכם):

```bash
GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy node scripts/get-refresh-token.mjs
```

עקבו אחרי ההוראות: פותחים את הקישור, מאשרים, מעתיקים את ה-`code`
מכתובת ה-`http://localhost/?code=...`, ומדביקים בטרמינל. יודפס ה-refresh token.

## שלב 5 — משתני סביבה

צרו קובץ `.env.local` (ראו `.env.example`) עם:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
GOOGLE_CALENDAR_ID=primary
BARBER_TIMEZONE=Asia/Jerusalem
```

הריצו `npm run dev`. מרגע זה כל תור:

- **נוצר כאירוע ביומן שלך** — זו ההתראה שלך כספר.
- **הלקוח מקבל מייל אישור** (אם הזין אימייל) + תזכורת יום לפני, אוטומטית מ-Google.
- **ביטול בפאנל הניהול** מוחק את האירוע ושולח ללקוח מייל ביטול.
- **שעות פנויות** מחושבות לפי שעות הפעילות *פחות* כל מה שתפוס ביומן
  (תורים, חסימות, חופשים) — דרך FreeBusy API.

> בפריסה ל-Vercel: הגדירו את אותם משתני סביבה תחת
> *Project → Settings → Environment Variables*.

---

## ניהול הזמינות (אחרי החיבור)

לא צריך מערכת נפרדת — היומן שלך הוא מקור האמת:

| מה שצריך | מה לעשות ביומן Google |
|----------|------------------------|
| הפסקת צהריים | אירוע רגיל באותו זמן |
| יום חופש | אירוע "כל היום" |
| חופשה | אירוע כל-היום שנמשך כמה ימים |
| סגירה מוקדמת | חסימת שעות הערב באירוע |

כל אלה ייעלמו אוטומטית מהשעות שמוצעות ללקוחות. שינוי **קבוע** בלו"ז
(שעות פתיחה/סגירה) נעשה בקובץ `types/index.ts` בטבלת `WEEK_HOURS`.
