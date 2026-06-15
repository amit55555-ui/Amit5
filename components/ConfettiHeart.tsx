'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EMOJIS = ['💖','✨','⭐','💕','🌟','💗','💫'];

interface Particle { id: number; emoji: string; x: number; tx: number; delay: number; dur: number; size: number; }

export default function ConfettiHeart({ trigger }: { trigger: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger === 0) return;
    const ps: Particle[] = Array.from({ length: 22 }, (_, i) => ({
      id: trigger * 100 + i,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      x: 20 + Math.random() * 60,
      tx: (Math.random() - 0.5) * 40,
      delay: Math.random() * 0.25,
      dur: 0.7 + Math.random() * 0.5,
      size: 0.8 + Math.random() * 1.0,
    }));
    setParticles(ps);
    const t = setTimeout(() => setParticles([]), 1600);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {particles.map(p => (
          <motion.div key={p.id}
            initial={{ x: `${p.x}vw`, y: '82vh', scale: p.size * 0.4, opacity: 1 }}
            animate={{ x: `calc(${p.x}vw + ${p.tx}vw)`, y: `${15 + Math.random() * 40}vh`, scale: p.size, opacity: 0 }}
            transition={{ duration: p.dur, delay: p.delay, ease: 'easeOut' }}
            exit={{ opacity: 0 }}
            className="absolute select-none"
            style={{ fontSize: `${1.2 + p.size * 0.5}rem`, willChange: 'transform' }}
          >
            {p.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
