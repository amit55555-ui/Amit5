'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LS_KEY = 'shuk_onboarding_done';

export default function OnboardingOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(LS_KEY)) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(LS_KEY, '1');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          className="fixed inset-0 z-[100] bg-black/75 flex flex-col items-center justify-center p-8"
          onClick={dismiss}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 20 }}
            className="bg-white rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl p-3.5 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#ff6b35,#f9a825)' }}>
              <img src="/logo.svg" alt="מציאון" className="w-full h-full" />
            </div>
            <h2 className="text-2xl font-black text-dark mb-2">ברוכים הבאים למציאון!</h2>
            <p className="text-soft text-sm mb-6 leading-relaxed">אלפי מציאות מאלי אקספרס — בהחלקה פשוטה</p>

            <div className="flex flex-col gap-3 mb-6 text-right">
              <SwipeHint
                icon="👉"
                color="bg-green-50 border-green-200"
                text={<><span className="font-black text-green-700">החלק ימינה</span> — לקנייה! פותח את המוצר</>}
                anim={{ x: [0, 60, 0], transition: { repeat: Infinity, duration: 1.6, delay: 0.2 } }}
              />
              <SwipeHint
                icon="👆"
                color="bg-pink-50 border-pink-200"
                text={<><span className="font-black text-pink-600">החלק למעלה</span> — שמור למועדפים</>}
                anim={{ y: [0, -50, 0], transition: { repeat: Infinity, duration: 1.6, delay: 0.4 } }}
              />
              <SwipeHint
                icon="👈"
                color="bg-red-50 border-red-200"
                text={<><span className="font-black text-red-600">החלק שמאלה</span> — דלג למוצר הבא</>}
                anim={{ x: [0, -60, 0], transition: { repeat: Infinity, duration: 1.6, delay: 0.6 } }}
              />
            </div>

            <button
              onClick={dismiss}
              className="w-full bg-orange hover:bg-deep-orange text-white font-black py-3.5 rounded-2xl transition-colors text-base shadow-lg shadow-orange/30"
            >
              🚀 בואו נתחיל!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SwipeHint({
  icon, color, text, anim,
}: {
  icon: string;
  color: string;
  text: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  anim: any;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl p-3 border ${color}`}>
      <motion.div animate={anim} className="text-2xl flex-shrink-0">{icon}</motion.div>
      <p className="text-xs text-dark leading-snug">{text}</p>
    </div>
  );
}
