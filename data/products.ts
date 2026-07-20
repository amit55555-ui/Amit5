import type { Product } from '@/types';

export const PRODUCTS: Product[] = [
  // ── בית ──
  { id:'p001', name:'מנורת לד חכמה עם שלט Wifi', cat:'home', desc:'נורה חכמה 12W עם 16 מיליון צבעים, שליטה מהאפליקציה, תאימות לאלקסה וגוגל הום. חיסכון של 80% בחשמל.', price:'35', orig:'65', link:'https://s.click.aliexpress.com/e/_okTNzHl', emoji:'💡', badge:'top', stars:5 },
  { id:'p002', name:'שעון קיר עם מסגרת עץ מינימליסטי', cat:'home', desc:'שעון שקט (no-tick) עם מנגנון יפני, קוטר 30 ס"מ, מסגרת אורן טבעי. מתאים לסלון, מטבח ומשרד.', price:'49', orig:'89', link:'https://s.click.aliexpress.com/e/_oFQpJ3x', emoji:'🕐', badge:'rec', stars:4 },
  { id:'p003', name:'שטיח אנטי-החלקה לאמבטיה – סט 3 חלקים', cat:'home', desc:'סט שטיחים מיקרופייבר אולטרה-סופג. ציפוי גומי נגד החלקה, ניתן לכביסה במכונה. 3 גדלים.', price:'59', orig:'110', link:'https://s.click.aliexpress.com/e/_opDq1Fz', emoji:'🛁', badge:'sale', stars:4 },
  { id:'p004', name:'מראה עגולה עם מסגרת זהב 40 ס"מ', cat:'home', desc:'מראה דקורטיבית לסלון/פרוזדור. מסגרת מתכת בציפוי זהב, קוטר 40 ס"מ, קל לתלייה.', price:'79', orig:'140', link:'https://s.click.aliexpress.com/e/_oEJb5Vf', emoji:'🪞', badge:'new', stars:5 },
  { id:'p005', name:'כרית קצף זיכרון ארגונומית', cat:'home', desc:'כרית קצף זיכרון עם תמיכה צווארית. נושמת, נוגדת אלרגיה, עם כיסוי נשלף לכביסה.', price:'89', orig:'160', link:'https://s.click.aliexpress.com/e/_omH9bFB', emoji:'🛏️', badge:'top', stars:5 },

  // ── ניקיון ──
  { id:'p006', name:'מגב מגנטי לחלונות עם שני צדדים', cat:'cleaning', desc:'מגב מגנטי לניקוי שני צדדי הזכוכית בו-זמנית. מתאים לעובי 5–28 מ"מ, בטוח וקל לשימוש.', price:'45', orig:'80', link:'https://s.click.aliexpress.com/e/_oFRmT9B', emoji:'🪟', badge:'rec', stars:4 },
  { id:'p007', name:'מברשת ניקוי אסלה סיליקון אוטומטית', cat:'cleaning', desc:'ראש סיליקון גמיש שמנקה כל פינה, בסיס עצמאי אטום, אין ריח, קל לניקוי.', price:'39', orig:'70', link:'https://s.click.aliexpress.com/e/_okKBGdX', emoji:'🚽', badge:'', stars:4 },
  { id:'p008', name:'ספוג מיקרופייבר לרכב – 6 יח\'', cat:'cleaning', desc:'ספוגי מיקרופייבר 600 GSM, 6 חתיכות. מושלמים לניגוב ללא שריטות. לרכב, ריהוט ועוד.', price:'29', orig:'55', link:'https://s.click.aliexpress.com/e/_oBZnGXx', emoji:'🧽', badge:'sale', stars:5 },
  { id:'p009', name:'גלגלת הסרת שיער מבגדים – 5 גלילים', cat:'cleaning', desc:'גלגלת דביקה עם 5 גלילים חלופיים של 60 שכבות כל אחד. מסירה שיער, פסולת ואבק מבגדים.', price:'19', orig:'38', link:'https://s.click.aliexpress.com/e/_oDXz5Nt', emoji:'🧹', badge:'top', stars:5 },
  { id:'p010', name:'טאבלטים מרוכזים לניקוי אסלה – 50 יח\'', cat:'cleaning', desc:'טאבלטים מרוכזים: פשוט זרוק לאסלה ושטוף. ריח לבנדר, מסיר אבנית ורובד.', price:'25', orig:'45', link:'https://s.click.aliexpress.com/e/_oEMHf2p', emoji:'✨', badge:'new', stars:4 },

  // ── ילדים ──
  { id:'p011', name:'ערכת ציור מים קסמים – 80 כרטיסים', cat:'kids', desc:'כרטיסי ציור שמתמלאים בצבע כשמציירים עליהם מים. ללא עמק, קל לניקוי, לגיל 2+.', price:'39', orig:'70', link:'https://s.click.aliexpress.com/e/_okHvRJl', emoji:'🎨', badge:'top', stars:5 },
  { id:'p012', name:'מכונית שלט רחוק פנסי 4×4 – 2.4GHz', cat:'kids', desc:'רכב שלט מהיר עד 25 קמ"ש, 4 גלגלי הנעה, מתאים לשטח ולרחוב. סוללה נטענת 40 דק\' ריצה.', price:'99', orig:'180', link:'https://s.click.aliexpress.com/e/_oCzqXJL', emoji:'🚗', badge:'rec', stars:5 },
  { id:'p013', name:'קוביות בנייה LED זוהרות בחושך – 120 יח\'', cat:'kids', desc:'קוביות LEGO-תואמות שזוהרות בחושך. 120 חלקים בצבעים שונים. בטוח לגיל 6+.', price:'55', orig:'95', link:'https://s.click.aliexpress.com/e/_oFmNKWt', emoji:'🧱', badge:'new', stars:4 },
  { id:'p014', name:'מגנט ציור חינוכי לגיל 2–6', cat:'kids', desc:'לוח מחיקה מגנטי A4 עם עט ומגנטים. אין צבעים, אין עמק, מחיקה בלחיצה. מושלם לנסיעות.', price:'29', orig:'55', link:'https://s.click.aliexpress.com/e/_ompq3ZX', emoji:'🖊️', badge:'sale', stars:4 },
  { id:'p015', name:'בריכת ילדים מתנפחת עם מזרקה – 150 ס"מ', cat:'kids', desc:'בריכה עגולה 150 ס"מ עם מזרקת ריסוס מרכזית. עובי מוגבר, שסתום מהיר, כולל משאבה.', price:'119', orig:'210', link:'https://s.click.aliexpress.com/e/_olDrCBD', emoji:'🏊', badge:'top', stars:5 },

  // ── מסיבת רווקות ──
  { id:'p016', name:'כתר טיארה ורוד עם נוצות', cat:'bachelorette', desc:'כתר נוצות ורוד עם כיתוב "Bride to Be" בקריסטלים. גמיש לכל גודל ראש. מגיע בשקית מתנה.', price:'25', orig:'48', link:'https://s.click.aliexpress.com/e/_opBEQVb', emoji:'👑', badge:'top', stars:5 },
  { id:'p017', name:'סרט Bride to Be עם LED – 5 מ\'', cat:'bachelorette', desc:'סרט ורוד מנצנץ עם אורות LED. אידאלי לקישוט אולם/בית. כולל סוללה, 5 מטר.', price:'35', orig:'62', link:'https://s.click.aliexpress.com/e/_olPTknZ', emoji:'✨', badge:'new', stars:4 },
  { id:'p018', name:'סט בלונים ורוד זהב – 70 יח\'', cat:'bachelorette', desc:'70 בלונים בגוונים ורוד+זהב+לבן, כולל בלוני כרום, סרטים וקישוטי כוכבים.', price:'29', orig:'55', link:'https://s.click.aliexpress.com/e/_oBnkART', emoji:'🎈', badge:'sale', stars:5 },
  { id:'p019', name:'משחק שתייה "אני לעולם לא" – 50 קלפים', cat:'bachelorette', desc:'50 קלפי משחק מצחיקים לרווקות. מציץ אסור – עד שתשחקו!', price:'22', orig:'40', link:'https://s.click.aliexpress.com/e/_oEfhMYB', emoji:'🃏', badge:'rec', stars:4 },

  // ── פוקימון ──
  { id:'p020', name:'חבילת קלפי פוקימון 110 קלפים', cat:'pokemon', desc:'110 קלפים כולל GX, EX ו-VMAX. שתי \'מבצרים\' אחים. מושלם לאוספים ולמשחק.', price:'45', orig:'85', link:'https://s.click.aliexpress.com/e/_oCJpZHN', emoji:'🃏', badge:'top', stars:5 },
  { id:'p021', name:'פיגרינה פיקאצ\'ו מנורת לד 15 ס"מ', cat:'pokemon', desc:'פסלון פיקאצ\'ו עם נורת LED בפנים שמשנה צבעים. גובה 15 ס"מ, מגיע בקופסת מתנה.', price:'55', orig:'95', link:'https://s.click.aliexpress.com/e/_oDfJA2B', emoji:'⚡', badge:'new', stars:5 },
  { id:'p022', name:'תיק PVC פוקמון שקוף', cat:'pokemon', desc:'תיק צד מאקרילי שקוף עם הדפסת פוקמון. מתאים לטלפון, ארנק ומפתחות. 4 דגמים לבחירה.', price:'49', orig:'85', link:'https://s.click.aliexpress.com/e/_okL7sMv', emoji:'🎒', badge:'rec', stars:4 },
  { id:'p023', name:'קופסת פח פוקימון לאחסון קלפים', cat:'pokemon', desc:'קופסת מתכת 10×7×3 ס"מ עם הדפסת פוקמון מלאה. מחזיקה עד 200 קלפים. שישה עיצובים.', price:'29', orig:'52', link:'https://s.click.aliexpress.com/e/_oFJpR0w', emoji:'📦', badge:'sale', stars:4 },

  // ── גאדג'טים וטכנולוגיה ──
  { id:'p024', name:'מטען אלחוטי מהיר 15W 3 ב-1', cat:'gadgets', desc:'מטען מהיר ל-iPhone + AirPods + Apple Watch בו-זמנית. הספק 15W, תומך MagSafe.', price:'89', orig:'160', link:'https://s.click.aliexpress.com/e/_olDh6Gx', emoji:'🔋', badge:'top', stars:5 },
  { id:'p025', name:'מיני מצלמת ריגול 4K WiFi', cat:'gadgets', desc:'מצלמה זעירה 4K עם WiFi, ראיית לילה, גילוי תנועה ואחסון בכרטיס SD. גוף 2×2 ס"מ.', price:'119', orig:'210', link:'https://s.click.aliexpress.com/e/_oFRbGLh', emoji:'📷', badge:'rec', stars:4 },
  { id:'p026', name:'אוזניות TWS ביטול רעשים ANC', cat:'gadgets', desc:'אוזניות אלחוטיות עם ANC, צליל Hi-Fi, 30 שעות סוללה, עמיד במים IPX5. תואם לכל מכשיר.', price:'129', orig:'240', link:'https://s.click.aliexpress.com/e/_oBxnpkx', emoji:'🎧', badge:'sale', stars:5 },
  { id:'p027', name:'USB Hub 7 ב-1 Type-C אלומיניום', cat:'gadgets', desc:'מרכז USB-C עם 4K HDMI, 3× USB 3.0, SD/TF, PD 100W. עיצוב אלומיניום דק במיוחד.', price:'75', orig:'135', link:'https://s.click.aliexpress.com/e/_okByDwp', emoji:'💻', badge:'new', stars:4 },

  // ── רכב ואביזרים ──
  { id:'p028', name:'מצלמת דשבורד 4K WiFi קדמית+אחורית', cat:'auto', desc:'מצלמה כפולה 4K+1080P עם GPS, WiFi, ראיית לילה, WDR. שדה ראייה 170 מעלות.', price:'149', orig:'280', link:'https://s.click.aliexpress.com/e/_oE9MBqX', emoji:'📷', badge:'top', stars:5 },
  { id:'p029', name:'בושם לרכב מפזר ריח עץ ארז', cat:'auto', desc:'מפזר ריח עץ ארז טבעי לחריץ האוורור. מחזיק עד 60 יום, לא שמני, לא מטפטף.', price:'29', orig:'52', link:'https://s.click.aliexpress.com/e/_oBz4Dvb', emoji:'🌲', badge:'rec', stars:4 },
  { id:'p030', name:'מחזיק טלפון מגנטי לרכב 360 מעלות', cat:'auto', desc:'מחזיק מגנטי לוינט/דשבורד עם סיבוב 360 מעלות. מגנט 30N חזק, תואם לכל הטלפונים.', price:'39', orig:'70', link:'https://s.click.aliexpress.com/e/_okBLQep', emoji:'📱', badge:'sale', stars:5 },
  { id:'p031', name:'מדחס אוויר נייד לצמיגים 150PSI', cat:'auto', desc:'משאבת אוויר ניידת 12V/150PSI עם מסך LCD דיגיטלי. מתחבר לשקע הסיגריות. עם פנס.', price:'99', orig:'180', link:'https://s.click.aliexpress.com/e/_oBnkART', emoji:'🔧', badge:'new', stars:4 },

  // ── טיול וקמפינג ──
  { id:'p032', name:'בקבוק שמירת חום טיטניום 500מ"ל', cat:'camping', desc:'בקבוק טיטניום 500מ"ל – שומר חם 24 שעות, קר 48 שעות. משקל 180 גרם. כולל קרבינר.', price:'89', orig:'160', link:'https://s.click.aliexpress.com/e/_oCJpZHN', emoji:'🥤', badge:'top', stars:5 },
  { id:'p033', name:'פנס ראש LED 6 מצבים נטען USB', cat:'camping', desc:'פנס ראש 350 לומן עם 6 מצבי תאורה, עמיד במים IPX4, נטען USB. 8 שעות שימוש.', price:'55', orig:'95', link:'https://s.click.aliexpress.com/e/_oDfJA2B', emoji:'🔦', badge:'rec', stars:5 },
  { id:'p034', name:'כיסא קמפינג מתקפל קל – 1.5 ק"ג', cat:'camping', desc:'כיסא אלומיניום מתקפל 1.5 ק"ג, נשיאה עד 150 ק"ג, כיס צד, גב ישיר ארגונומי.', price:'129', orig:'230', link:'https://s.click.aliexpress.com/e/_okL7sMv', emoji:'🪑', badge:'sale', stars:4 },
  { id:'p035', name:'סכין שטח מולטי-טול 14 ב-1', cat:'camping', desc:'כלי שטח 14 בכלי אחד: סכין, משחיז, מספריים, פותחן, אזמל ופנס. נירוסטה 440C.', price:'75', orig:'135', link:'https://s.click.aliexpress.com/e/_oFJpR0w', emoji:'🔪', badge:'new', stars:4 },

  // ── בית ואחסון ──
  { id:'p036', name:'קופסאות אחסון מודולריות שקופות – סט 6', cat:'home', desc:'שישה קופסאות שקופות בגדלים שונים לארון/מגירה. ניתן לגיבוב, עם מכסה נגד אבק.', price:'65', orig:'120', link:'https://s.click.aliexpress.com/e/_olDh6Gx', emoji:'📦', badge:'top', stars:5 },
  { id:'p037', name:'ווי נשלפים לקיר ללא קידוח – 20 יח\'', cat:'home', desc:'ווים דביקים נשלפים לקיר, נשאים עד 5 ק"ג כל אחד. אין קידוח, אין עקבות. 20 יחידות.', price:'25', orig:'45', link:'https://s.click.aliexpress.com/e/_oFRbGLh', emoji:'🪝', badge:'rec', stars:4 },
  { id:'p038', name:'אורגנייזר מגירת מטבח – סט 9 תאים', cat:'home', desc:'מגש ארגון מגירה עם 9 תאים, מידות מתכווננות. חומר PP עמיד, קל לניקוי, גובה 5 ס"מ.', price:'45', orig:'80', link:'https://s.click.aliexpress.com/e/_oBxnpkx', emoji:'🗂️', badge:'new', stars:4 },
  { id:'p039', name:'מנשא תיקים אנכי לארון – 6 ווים', cat:'home', desc:'מתלה 6 ווים לדלת/קיר לתיקים, ניות וצעיפים. אלומיניום+סיליקון, נשיאה 15 ק"ג.', price:'35', orig:'65', link:'https://s.click.aliexpress.com/e/_okByDwp', emoji:'👜', badge:'sale', stars:5 },
  { id:'p040', name:'שקיות ואקום לחיסכון במקום – סט 10', cat:'home', desc:'10 שקיות ואקום (5 גדולות + 5 קטנות) למיטות, שמיכות ובגדים. חיסכון 80% מקום.', price:'55', orig:'99', link:'https://s.click.aliexpress.com/e/_oE9MBqX', emoji:'🛍️', badge:'top', stars:5 },
];
