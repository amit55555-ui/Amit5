# מערכת ניהול בניין — מדריך הפעלה

אפליקציה לדיירי בניין: דיווח על תקלות (נורה שרופה, אשפה, מעלית ועוד),
מעקב אחרי הפניות והסטטוס שלהן, ותקשורת עם ועד הבית. תומכת בבניין ארוך
עם **מספר כניסות (מספרי בניין)** המחוברים יחדיו.

## הפעלה מקומית

```bash
npm install
npm run dev
```

פתחו <http://localhost:3000>. האפליקציה עובדת **מיד** ללא הגדרות:
- דיירים מדווחים תקלות ורואים את היסטוריית הפניות שלהם.
- כניסת ועד הבית בלשונית «ועד הבית» — קוד ברירת מחדל לדמו: **1234**.

> במצב הבסיסי הפניות נשמרות בקובץ JSON בצד השרת (`DATA_DIR`, ברירת מחדל
> ספריית temp). אם לא מגדירים שליחת מיילים — פשוט לא נשלחים מיילים, כל
> שאר הפונקציות עובדות.

## התאמת הבניין

ב-`.env.local` (העתיקו מ-`.env.example`):

```bash
NEXT_PUBLIC_BUILDING_NAME=בניין רחוב הברוש
NEXT_PUBLIC_ENTRANCES=12,14,16,18   # הכניסות המחוברות
COMMITTEE_PASSCODE=בחרו-קוד-משלכם   # קוד גישת הוועד
```

או ערכו ישירות את `data/building.ts` (גם רשימת הקטגוריות נמצאת שם).

---

## חיבור שליחת מיילים (אופציונלי, ~10 דקות)

כדי שכל פנייה חדשה תישלח **לוועד במייל**, ושתגובות/שינויי סטטוס יישלחו
**לדייר במייל** — צריך חיבור חד-פעמי ל-Gmail. חשבון Gmail רגיל עובד מצוין.

### שלב 1 — פרויקט והפעלת Gmail API
1. <https://console.cloud.google.com/> → התחברו עם חשבון הוועד.
2. צרו פרויקט חדש.
3. חיפוש "Gmail API" → **Enable**.

### שלב 2 — מסך הסכמה (OAuth consent screen)
1. *APIs & Services → OAuth consent screen* → External → מלאו שם ואימייל.
2. תחת *Test users* הוסיפו את כתובת ה-Gmail של הוועד.

### שלב 3 — Credentials
1. *APIs & Services → Credentials → Create Credentials → OAuth client ID*.
2. סוג: **Desktop app** → צרו.
3. העתיקו את `Client ID` ו-`Client Secret`.

### שלב 4 — קבלת Refresh Token
```bash
GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy npm run get-token
```
פתחו את הקישור, אשרו, הדביקו את הקוד — ותקבלו `GOOGLE_REFRESH_TOKEN`.

### שלב 5 — מילוי `.env.local`
```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
COMMITTEE_EMAIL=vaad@example.com   # לאן נשלחים הדיווחים
```

הפעילו מחדש (`npm run dev`). עכשיו:
- פנייה חדשה → מייל לוועד (עם **Reply-To של הדייר**, אפשר להשיב ישירות).
- שינוי סטטוס / תגובת ועד מתוך האפליקציה → מייל לדייר.

---

## פריסה (Vercel)

1. דחפו ל-GitHub וייבאו ב-Vercel.
2. הוסיפו את משתני הסביבה שלמעלה ב-*Project Settings → Environment Variables*.

> **הערה על אחסון:** מחסן ה-JSON המובנה מתאים להרצה מקומית / שרת יחיד.
> בסביבת serverless רב-מופעית (כמו Vercel) הקובץ אינו מתמיד בין מופעים —
> לשימוש אמיתי חברו מסד נתונים מתמיד (Vercel KV / Postgres) במקום
> `lib/store.ts`. שליחת המיילים לוועד עובדת בכל מקרה ומשמשת גם כגיבוי.

---

## מבנה הפרויקט

| נתיב | תיאור |
|------|-------|
| `app/page.tsx` | מסך ראשי + לשוניות (דיווח / הפניות שלי / ועד) |
| `components/ReportForm.tsx` | טופס דיווח תקלה |
| `components/MyReports.tsx` | היסטוריית הפניות של הדייר |
| `components/CommitteeDashboard.tsx` | דשבורד ועד (כל הפניות, סינון, סטטוס) |
| `components/ReportCard.tsx` / `Thread.tsx` | כרטיס פנייה ושרשור תכתובת |
| `lib/store.ts` | מחסן הפניות בצד השרת |
| `lib/mailer.ts` / `lib/google.ts` | שליחת מיילים דרך Gmail |
| `app/api/reports/*` | API לפניות (יצירה, רשימה, עדכון) |
| `data/building.ts` | שם הבניין, כניסות וקטגוריות |
