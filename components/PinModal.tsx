'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PIN_KEY = 'catchit_admin_pin';
const DEFAULT_PIN = '2389';

export function getAdminPin(): string {
  if (typeof window === 'undefined') return DEFAULT_PIN;
  return localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
}
export function setAdminPin(pin: string) {
  if (typeof window !== 'undefined') localStorage.setItem(PIN_KEY, pin);
}

interface Props { onSuccess: () => void; onCancel: () => void; }

export default function PinModal({ onSuccess, onCancel }: Props) {
  const [input, setInput]   = useState('');
  const [shake, setShake]   = useState(false);
  const [success, setSuccess] = useState(false);

  const handleKey = (k: string) => {
    if (shake) return;
    if (k === 'del') { setInput(i => i.slice(0, -1)); return; }
    const next = input + k;
    setInput(next);
    if (next.length === 4) {
      if (next === getAdminPin()) {
        setSuccess(true);
        setTimeout(onSuccess, 400);
      } else {
        setShake(true);
        setTimeout(() => { setShake(false); setInput(''); }, 700);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(15,4,16,0.95)', backdropFilter: 'blur(14px)' }}
    >
      <motion.div
        initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 18, stiffness: 280 }}
        className="text-center px-8"
      >
        <motion.div animate={shake ? { x: [-8,8,-8,8,0] } : {}} transition={{ duration: 0.4 }}>
          <div className="text-5xl mb-3">{success ? '✅' : '🔐'}</div>
          <div className="text-white font-black text-xl mb-1">ממשק ניהול</div>
          <div className="text-white/40 text-xs mb-7">הזיני קוד ניהול</div>

          {/* Dots */}
          <div className="flex gap-5 justify-center mb-8">
            {[0,1,2,3].map(i => (
              <motion.div key={i}
                animate={{ scale: input.length > i ? 1.2 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="w-4 h-4 rounded-full transition-colors duration-150"
                style={{
                  background: success ? '#22c55e' :
                    shake ? '#ef4444' :
                    input.length > i ? 'linear-gradient(135deg,#c14b7c,#9c3060)' :
                    'rgba(255,255,255,0.18)'
                }} />
            ))}
          </div>
        </motion.div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-[220px] mx-auto mb-5">
          {['1','2','3','4','5','6','7','8','9','','0','del'].map((k,i) =>
            k === '' ? <div key={i} /> :
            <button key={k+i} onClick={() => handleKey(k)}
              className="h-[58px] rounded-2xl font-black text-lg text-white transition-all active:scale-90"
              style={{ background: k === 'del' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)',
                       boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
              {k === 'del' ? '⌫' : k}
            </button>
          )}
        </div>

        <button onClick={onCancel} className="text-white/30 text-sm font-semibold hover:text-white/60 transition-colors">
          ביטול
        </button>
      </motion.div>
    </motion.div>
  );
}
