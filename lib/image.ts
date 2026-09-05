// ===== דחיסת תמונה בצד הלקוח =====
// מקטין ודוחס תמונה שנבחרה ע"י המשתמש כדי לשמור על גודל בקשה סביר.

export function fileToCompressedDataUrl(file: File, maxSize = 1280, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('קריאת הקובץ נכשלה'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('טעינת התמונה נכשלה'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const scale = maxSize / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('שגיאה בעיבוד התמונה'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
