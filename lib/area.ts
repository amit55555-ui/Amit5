// ===== זיהוי אזור / שכונה לפי מיקום =====
// קודם מנסה לקבל את שם השכונה מ-OpenStreetMap (Nominatim, בעברית).
// אם השירות לא זמין – מחלק את העיר לאזורים גסים לפי קווי רוחב/אורך.

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

// חלוקה גסה של תל אביב-יפו (משמשת רק כגיבוי)
export function roughArea(lat: number, lng: number): string {
  if (lat < 32.056 && lng < 34.775) return 'יפו';
  if (lat < 32.064) return 'דרום העיר';
  if (lat < 32.09) return 'מרכז העיר';
  if (lat < 32.1) return 'הצפון הישן';
  return 'צפון העיר (עבר הירקון)';
}

export async function detectArea(lat: number, lng: number): Promise<string> {
  try {
    const url = `${NOMINATIM_URL}?format=jsonv2&zoom=16&accept-language=he&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'tlv-water-leak-map (vercel.app)' },
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    });
    if (res.ok) {
      const data = (await res.json()) as { address?: Record<string, string> };
      const a = data.address ?? {};
      const name = a.suburb || a.neighbourhood || a.quarter || a.city_district;
      if (name) return name.slice(0, 80);
    }
  } catch {
    // נופלים לחלוקה הגסה
  }
  return roughArea(lat, lng);
}
