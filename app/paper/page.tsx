import PaperQuantityTracker from '@/components/PaperQuantityTracker';

export default function PaperPage() {
  return (
    <div className="mx-auto min-h-full max-w-2xl px-4 pb-16">
      <header className="py-6 text-center">
        <div className="mb-1 text-3xl">📄</div>
        <h1 className="text-xl font-bold sm:text-2xl">מעקב כמות ניירת</h1>
        <p className="mt-1 text-sm text-muted">הזנת כמות, השוואה לכמות שהתקבלה וחישוב הפרש</p>
      </header>

      <main>
        <PaperQuantityTracker />
      </main>
    </div>
  );
}
