'use client';

import { useState, useRef, useEffect } from 'react';
import { MUNICIPALITIES } from '@/data/municipalities';

interface Props {
  value: string;
  onChange: (id: string, name: string) => void;
}

export default function CitySelector({ value, onChange }: Props) {
  const [query, setQuery]   = useState('');
  const [open, setOpen]     = useState(false);
  const containerRef        = useRef<HTMLDivElement>(null);

  const selected = MUNICIPALITIES.find(m => m.id === value);

  const filtered = query.length >= 1
    ? MUNICIPALITIES.filter(m =>
        m.name.includes(query) || m.district.includes(query)
      ).slice(0, 12)
    : MUNICIPALITIES.slice(0, 12);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (id: string, name: string) => {
    onChange(id, name);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 border rounded-xl px-4 py-3 text-right
          bg-white transition-all
          ${value
            ? 'border-blue-400 ring-2 ring-blue-100 text-slate-900 font-semibold'
            : 'border-slate-300 text-slate-400'
          }`}
      >
        <span className="flex-1 truncate">
          {selected ? selected.name : 'בחר עיר / יישוב…'}
        </span>
        <span className="text-slate-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute z-50 right-0 left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              autoFocus
              placeholder="חפש עיר…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-right
                focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-slate-400 text-sm text-center">לא נמצאה עיר</li>
            )}
            {filtered.map(m => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(m.id, m.name)}
                  className={`w-full text-right px-4 py-2.5 flex items-center justify-between hover:bg-blue-50 transition-colors
                    ${m.id === value ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-800'}`}
                >
                  <span>{m.name}</span>
                  <span className="text-xs text-slate-400">{m.district}</span>
                </button>
              </li>
            ))}
            {query.length === 0 && MUNICIPALITIES.length > 12 && (
              <li className="px-4 py-2 text-xs text-slate-400 text-center border-t border-slate-100">
                הקלד לחיפוש מכל {MUNICIPALITIES.length} הרשויות
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
