import type { Product } from '@/types';

// Public app URL — appended to shares so recipients discover the app itself
// (a rich link preview is served via the Open Graph tags in app/layout.tsx),
// turning every share into a channel for new visitors.
export const APP_URL = 'https://amit5.pages.dev';

// Build a nice Hebrew share message for a single product.
function productMessage(p: Product): string {
  const price = p.price ? ` רק ב-₪${p.price}!` : '';
  return `😍 מצאתי מוצר מהמם ב"שוק הטעמים": ${p.name}${price}\n${p.link}\n\n🛍️ עוד אלפי מוצרים מנצחים: ${APP_URL}`;
}

// Open WhatsApp share dialog (works on mobile + desktop web).
export function shareToWhatsApp(text: string) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

// Use the native share sheet if available, fall back to WhatsApp.
export async function shareProduct(p: Product): Promise<'native' | 'whatsapp'> {
  const text = productMessage(p);
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: p.name, text, url: p.link });
      return 'native';
    } catch {
      /* user cancelled or unsupported — fall through */
    }
  }
  shareToWhatsApp(text);
  return 'whatsapp';
}

// Share a whole list of liked products.
export async function shareList(products: Product[]): Promise<'native' | 'whatsapp'> {
  const lines = products.map((p, i) => {
    const price = p.price ? ` (₪${p.price})` : '';
    return `${i + 1}. ${p.name}${price}\n${p.link}`;
  });
  const text = `🛍️ הנה המוצרים שאהבתי ב"שוק הטעמים":\n\n${lines.join('\n\n')}\n\n✨ גלה עוד: ${APP_URL}`;
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: 'המוצרים שאהבתי', text });
      return 'native';
    } catch {
      /* fall through */
    }
  }
  shareToWhatsApp(text);
  return 'whatsapp';
}
