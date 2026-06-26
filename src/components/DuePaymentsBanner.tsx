import React, { useState, useEffect } from 'react';
import { Calendar, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function DuePaymentsBanner() {
  const [hasDuePayments, setHasDuePayments] = useState(false);
  const [dueCount, setDueCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Listen to a direct CustomEvent dispatched on window, e.g. window.dispatchEvent(new CustomEvent('paymentDueToday', {detail: {count: 2}}))
    const handlePaymentAlert = (event: any) => {
      console.log('[DuePaymentsBanner] paymentDueToday custom event triggered:', event.detail);
      const count = event.detail?.count || 1;
      setDueCount(count);
      setHasDuePayments(true);
    };

    // 2. Listen to web message events just in case ReactNativeWebView posts string/object messages
    const handleWebMessage = (event: MessageEvent) => {
      try {
        let msgData = event.data;
        if (typeof msgData === 'string') {
          msgData = JSON.parse(msgData);
        }
        if (msgData && msgData.type === 'paymentDueToday') {
          console.log('[DuePaymentsBanner] paymentDueToday message received:', msgData);
          setDueCount(msgData.count || 1);
          setHasDuePayments(true);
        }
      } catch (e) {
        // Safe to ignore non-JSON messages
      }
    };

    window.addEventListener('paymentDueToday', handlePaymentAlert);
    window.addEventListener('message', handleWebMessage);

    return () => {
      window.removeEventListener('paymentDueToday', handlePaymentAlert);
      window.removeEventListener('message', handleWebMessage);
    };
  }, []);

  const handleAction = () => {
    setHasDuePayments(false);
    navigate('/expenses-planner');
  };

  return (
    <AnimatePresence>
      {hasDuePayments && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          className="fixed top-2 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl"
          id="due-payments-banner-wrapper"
        >
          <div className="bg-red-500 text-white rounded-2xl px-4 py-3.5 shadow-[0_10px_25px_-4px_rgba(239,68,68,0.4)] flex items-center justify-between gap-3 border border-red-400/30">
            <div className="flex items-center gap-2.5 min-w-0" onClick={handleAction}>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                <Calendar size={16} className="text-white" />
              </div>
              <div className="min-w-0 cursor-pointer">
                <p className="text-xs font-bold leading-tight">Payment Deadline Today!</p>
                <p className="text-[10px] text-white/80 mt-0.5 truncate leading-tight">
                  You have {dueCount > 1 ? `${dueCount} bills` : 'a bill'} due for settlement today. Avoid late charges.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleAction}
                className="bg-white text-red-600 px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 hover:bg-red-50 transition-colors"
                id="due-payments-action-btn"
              >
                Settle Now
                <ArrowRight size={10} />
              </button>
              <button
                onClick={() => setHasDuePayments(false)}
                className="p-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Dismiss alert"
                id="due-payments-close-btn"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
