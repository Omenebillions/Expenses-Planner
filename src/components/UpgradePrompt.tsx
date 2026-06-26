import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Check, ShieldAlert, CreditCard, X, Loader2 } from 'lucide-react';
import { useNativeBridge } from '../hooks/useNativeBridge';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/currency';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  onSuccess?: () => void;
}

export default function UpgradePrompt({ isOpen, onClose, featureName = "Premium Services", onSuccess }: UpgradePromptProps) {
  const { bridge, refreshPremiumStatus } = useNativeBridge();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | 'business'>('yearly');
  
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const currencyCode = userProfile?.currency || 'USD';

  useEffect(() => {
    if (isOpen && currencyCode !== 'USD') {
      fetch('https://open.er-api.com/v6/latest/USD')
        .then(res => res.json())
        .then(data => {
          if (data && data.rates && data.rates[currencyCode]) {
            setExchangeRate(data.rates[currencyCode]);
          }
        })
        .catch(err => console.error("Error fetching exchange rate:", err));
    }
  }, [isOpen, currencyCode]);

  if (!isOpen) return null;

  const getPrice = (usdPrice: number) => {
    return formatCurrency(usdPrice * exchangeRate, currencyCode);
  };

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      if (bridge?.purchasePremium) {
        const success = await bridge.purchasePremium(selectedPlan);
        if (success) {
          await refreshPremiumStatus();
          if (onSuccess) onSuccess();
          onClose();
        } else {
          setError("Subscription payment flow could not be processed.");
        }
      } else {
        // Mock fallback if on web and somehow didn't activate
        localStorage.setItem('youfi_premium', 'true');
        await refreshPremiumStatus();
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error("Upgrade error:", err);
      setError(err?.message || "An unexpected purchase error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-100 flex flex-col relative animate-in fade-in zoom-in-95 duration-200 hide-scrollbar"
        id="upgrade-prompt-modal"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors z-[110]"
          disabled={loading}
          id="close-upgrade-btn"
        >
          <X size={16} />
        </button>

        {/* Banner */}
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-3">
            <Sparkles size={24} className="text-amber-300 fill-amber-300" />
          </div>
          <h2 className="text-xl font-bold">Upgrade to Premium</h2>
          <p className="text-xs text-white/80 mt-1">Unlock {featureName} & Advanced CFO Tools</p>
        </div>

        {/* Info */}
        <div className="p-6 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-700 p-3 rounded-2xl flex gap-2 items-center text-xs font-medium">
              <ShieldAlert size={16} className="text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Included features</p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-start gap-2.5 text-xs text-gray-700">
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mt-0.5">
                <Check size={10} className="stroke-[3]" />
              </div>
              <div>
                <span className="font-semibold text-gray-900">Push-To-Calendar Sync</span>
                <p className="text-[10px] text-gray-400">Instantly schedule bills & personal debt payments directly onto Google/iOS accounts.</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-gray-700">
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mt-0.5">
                <Check size={10} className="stroke-[3]" />
              </div>
              <div>
                <span className="font-semibold text-gray-900">AI Receipt Scanner</span>
                <p className="text-[10px] text-gray-400">Snap physical/digital merchant sheets; parser auto-extracts values into transactions.</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-gray-700">
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mt-0.5">
                <Check size={10} className="stroke-[3]" />
              </div>
              <div>
                <span className="font-semibold text-gray-900">Unified Push Alert Core</span>
                <p className="text-[10px] text-gray-400">Receive smart, real-time alert triggers directly on your screen & system bar daily.</p>
              </div>
            </li>
          </ul>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Choose plan</p>
          <div className="grid grid-cols-3 gap-2 mb-6">
            <button
              onClick={() => setSelectedPlan('monthly')}
              disabled={loading}
              className={`p-3 rounded-2xl border text-center transition-all ${
                selectedPlan === 'monthly'
                  ? 'border-brand-500 bg-brand-50/20 shadow-sm ring-1 ring-brand-500'
                  : 'border-gray-100 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="block text-[10px] font-bold text-gray-400 uppercase">Monthly</span>
              <span className="block text-sm font-bold text-gray-950 mt-1">{getPrice(4.99)}</span>
            </button>
            <button
              onClick={() => setSelectedPlan('yearly')}
              disabled={loading}
              className={`p-3 rounded-2xl border text-center relative transition-all ${
                selectedPlan === 'yearly'
                  ? 'border-brand-500 bg-brand-50/20 shadow-sm ring-1 ring-brand-500'
                  : 'border-gray-100 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-widest leading-none">Best</span>
              <span className="block text-[10px] font-bold text-gray-400 uppercase">Yearly</span>
              <span className="block text-sm font-bold text-gray-950 mt-1">{getPrice(39.99)}</span>
            </button>
            <button
              onClick={() => setSelectedPlan('business')}
              disabled={loading}
              className={`p-3 rounded-2xl border text-center transition-all ${
                selectedPlan === 'business'
                  ? 'border-brand-500 bg-brand-50/20 shadow-sm ring-1 ring-brand-500'
                  : 'border-gray-100 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="block text-[10px] font-bold text-gray-400 uppercase">Business</span>
              <span className="block text-sm font-bold text-gray-950 mt-1">{getPrice(99.99)}</span>
            </button>
          </div>

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full bg-gray-900 text-white rounded-2xl py-3.5 font-bold text-sm shadow-lg shadow-gray-900/10 hover:bg-gray-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            id="finalize-upgrade-submit"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing Safe Purchase...
              </>
            ) : (
              <>
                <CreditCard size={16} />
                Activate {selectedPlan === 'monthly' ? 'Monthly' : selectedPlan === 'yearly' ? 'Yearly' : 'Business'} Premium
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
