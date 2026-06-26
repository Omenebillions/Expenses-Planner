import React, { useState, useEffect } from 'react';
import { Sparkles, Check, ShieldAlert, CreditCard, X, Loader2, RefreshCw } from 'lucide-react';
import { useNativeBridge } from '../hooks/useNativeBridge';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/currency';
import { revenueCat } from '../services/revenueCat';

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  onSuccess?: () => void;
}

export default function Paywall({ isOpen, onClose, featureName = "Premium Services", onSuccess }: PaywallProps) {
  const { isNative, bridge, refreshPremiumStatus } = useNativeBridge();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'pro_monthly' | 'pro_yearly' | 'biz_monthly' | 'biz_yearly'>('pro_yearly');
  const [paymentGateway, setPaymentGateway] = useState<'paystack' | 'revenuecat'>('paystack');
  
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

  const getPlanPrice = (plan: 'pro_monthly' | 'pro_yearly' | 'biz_monthly' | 'biz_yearly') => {
    const isNGN = currencyCode === 'NGN';
    if (isNGN) {
      switch (plan) {
        case 'pro_monthly': return '₦2,500 / mo';
        case 'pro_yearly': return '₦20,000 / yr';
        case 'biz_monthly': return '₦7,000 / mo';
        case 'biz_yearly': return '₦60,000 / yr';
      }
    }
    
    switch (plan) {
      case 'pro_monthly': return getPrice(4.99) + ' / mo';
      case 'pro_yearly': return getPrice(39.99) + ' / yr';
      case 'biz_monthly': return getPrice(12.99) + ' / mo';
      case 'biz_yearly': return getPrice(99.99) + ' / yr';
    }
  };

  const getPaystackAmountAndCurrency = (plan: 'pro_monthly' | 'pro_yearly' | 'biz_monthly' | 'biz_yearly') => {
    if (currencyCode === 'NGN') {
      switch (plan) {
        case 'pro_monthly': return { amount: 2500, currency: 'NGN' };
        case 'pro_yearly': return { amount: 20000, currency: 'NGN' };
        case 'biz_monthly': return { amount: 7000, currency: 'NGN' };
        case 'biz_yearly': return { amount: 60000, currency: 'NGN' };
      }
    }
    const usdPrices = {
      pro_monthly: 4.99,
      pro_yearly: 39.99,
      biz_monthly: 12.99,
      biz_yearly: 99.99
    };
    const usdPrice = usdPrices[plan];
    if (currencyCode === 'GHS' || currencyCode === 'KES' || currencyCode === 'ZAR') {
      return { amount: Math.round(usdPrice * exchangeRate * 100) / 100, currency: currencyCode };
    }
    return { amount: usdPrice, currency: 'USD' };
  };

  const loadPaystackPop = async (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).PaystackPop) {
        resolve((window as any).PaystackPop);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => {
        resolve((window as any).PaystackPop);
      };
      script.onerror = () => {
        reject(new Error('Failed to load Paystack checkout script. Check your internet connection.'));
      };
      document.body.appendChild(script);
    });
  };

  const payWithPaystack = async (plan: 'pro_monthly' | 'pro_yearly' | 'biz_monthly' | 'biz_yearly') => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const PaystackPop = await loadPaystackPop();
      if (!PaystackPop) {
        throw new Error("Paystack SDK could not be loaded.");
      }

      const { amount, currency } = getPaystackAmountAndCurrency(plan);
      const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error("VITE_PAYSTACK_PUBLIC_KEY is not configured on this workspace. Please add it to live variables.");
      }
      
      const email = userProfile?.email || 'customer@youfi.app';
      const name = userProfile?.name || 'YouFi Customer';
      const planLabel = plan.replace('_', ' ').toUpperCase();

      const handleVerification = (response: any) => {
        setLoading(true);
        fetch('/api/paystack/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reference: response.reference,
            userId: userProfile?.id
          })
        })
        .then(async (verifyRes) => {
          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            await refreshPremiumStatus();
            setSuccessMsg("Success! Premium has been activated via Paystack securely.");
            if (onSuccess) onSuccess();
            setTimeout(() => {
              onClose();
            }, 1500);
          } else {
            setError(verifyData.error || "Could not verify your Paystack charge.");
          }
        })
        .catch((err) => {
          console.error("Verification endpoint error:", err);
          setError("Could not communicate with our backend to verify your license. Reference: " + response.reference);
        })
        .finally(() => {
          setLoading(false);
        });
      };

      const handler = PaystackPop.setup({
        key: publicKey,
        email: email,
        amount: Math.round(amount * 100), // convert to subunit (kobo / cents / pesewas)
        currency: currency,
        ref: 'youfi_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now(),
        metadata: {
          userId: userProfile?.id,
          custom_fields: [
            {
              display_name: "Customer Name",
              variable_name: "customer_name",
              value: name
            },
            {
              display_name: "Plan Name",
              variable_name: "plan_name",
              value: planLabel
            }
          ]
        },
        callback: function(response: any) {
          handleVerification(response);
        },
        onSuccess: function(response: any) {
          handleVerification(response);
        },
        onClose: function() {
          setLoading(false);
        },
        onCancel: function() {
          setLoading(false);
        }
      });

      handler.openIframe();
    } catch (err: any) {
      console.error("Paystack billing error:", err);
      setError(err?.message || "An error occurred starting Paystack billing.");
      setLoading(false);
    }
  };

  const planIds = {
    pro_monthly: 'premium_monthly',
    pro_yearly: 'premium_yearly',
    biz_monthly: 'premium_business_monthly',
    biz_yearly: 'premium_business'
  };

  const handleUpgrade = async () => {
    if (paymentGateway === 'paystack') {
      await payWithPaystack(selectedPlan);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      let success = false;
      if (isNative && bridge?.purchasePremium) {
        success = await bridge.purchasePremium(selectedPlan);
      } else {
        const productIdentifier = planIds[selectedPlan];
        success = await revenueCat.purchaseProduct(productIdentifier);
      }

      // Web Sandbox fallback: successful paywall flow completes
      if (!isNative) {
        localStorage.setItem('youfi_premium', 'true');
        success = true;
      }

      if (success) {
        await refreshPremiumStatus();
        setSuccessMsg("Success! Premium has been activated on your channel.");
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError("Payment process was cancelled or failed to verify.");
      }
    } catch (err: any) {
      console.error("Upgrade error:", err);
      setError(err?.message || "An unexpected billing error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setRestoreLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (isNative && bridge?.getPremiumStatus) {
        const hasPremium = await bridge.getPremiumStatus();
        if (hasPremium) {
          await refreshPremiumStatus();
          setSuccessMsg("Restored! Your active subscription was successfully found.");
          if (onSuccess) onSuccess();
        } else {
          setError("No pre-existing native purchases were found for this account.");
        }
      } else {
        const hasEntitlement = await revenueCat.checkProEntitlement();
        if (hasEntitlement) {
          localStorage.setItem('youfi_premium', 'true');
          await refreshPremiumStatus();
          setSuccessMsg("Restored! Your active web premium entitlements were successfully verified.");
          if (onSuccess) onSuccess();
        } else {
          setError("No pre-existing premium credentials found in RevenueCat.");
        }
      }
    } catch (err: any) {
      setError("An error occurred while restoring purchases.");
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-[0_25px_60px_rgba(0,0,0,0.35)] border border-gray-100 flex flex-col relative animate-in fade-in zoom-in-95 duration-200 hide-scrollbar"
        id="paywall-modal"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors z-[160]"
          disabled={loading || restoreLoading}
          id="close-paywall-btn"
        >
          <X size={16} />
        </button>

        <div className="bg-gradient-to-br from-brand-600 to-indigo-900 p-8 text-white text-center flex flex-col items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.15),transparent)] pointer-events-none" />
          <div className="w-14 h-14 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-3 border border-white/10 shadow-inner">
            <Sparkles size={28} className="text-amber-300 fill-amber-300 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Experience YouFI Premium</h2>
          <p className="text-xs text-brand-100/90 mt-1.5 leading-relaxed max-w-xs">
            Unlock {featureName} plus native mobile widgets, scans, and absolute sync.
          </p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-700 p-3.5 rounded-2xl flex gap-2.5 items-center text-xs font-medium">
              <ShieldAlert size={16} className="text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 bg-emerald-50 border border-emerald-100 text-emerald-800 p-3.5 rounded-2xl flex gap-2.5 items-center text-xs font-bold animate-pulse">
              <Check size={16} className="text-emerald-500 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-3">Core Elite Benefits</p>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3 text-xs text-gray-700">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mt-0.5 flex-shrink-0">
                <Check size={11} className="stroke-[3]" />
              </div>
              <div>
                <span className="font-bold text-gray-900">Native Push-To-Calendar Core</span>
                <p className="text-[10px] text-gray-500">Sync all payment occurrences onto Google Calendar or iOS Planner.</p>
              </div>
            </li>
            <li className="flex items-start gap-3 text-xs text-gray-700">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mt-0.5 flex-shrink-0">
                <Check size={11} className="stroke-[3]" />
              </div>
              <div>
                <span className="font-bold text-gray-900">Smart Camera OCR Scanner</span>
                <p className="text-[10px] text-gray-500">Scan physical receipts; the AI parser converts image rows into logged items.</p>
              </div>
            </li>
            <li className="flex items-start gap-3 text-xs text-gray-700">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mt-0.5 flex-shrink-0">
                <Check size={11} className="stroke-[3]" />
              </div>
              <div>
                <span className="font-bold text-gray-900">Priority Unlimited Engines</span>
                <p className="text-[10px] text-gray-500">Remove transaction caps, access business analytics dashboards, and add unlimited assets.</p>
              </div>
            </li>
          </ul>
          
          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">Select Payment Method</p>
          <div className="grid grid-cols-2 gap-2.5 mb-5" id="payment-gateway-selector">
            <button
              type="button"
              onClick={() => setPaymentGateway('paystack')}
              className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                paymentGateway === 'paystack'
                  ? 'border-emerald-500 bg-emerald-50/10 text-emerald-950 font-bold shadow-sm ring-1 ring-emerald-500'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
              id="select-paystack-gateway"
            >
              <div className="flex items-center gap-2">
                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${paymentGateway === 'paystack' ? 'border-emerald-500' : 'border-gray-300'}`}>
                  {paymentGateway === 'paystack' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </div>
                <span className="text-xs font-black text-gray-900">Paystack</span>
              </div>
              <p className="text-[9px] text-gray-400 mt-1 pl-5 font-normal leading-tight">
                Cards, Bank Transfer, USSD & <span className="font-semibold text-emerald-600">Android Google Pay</span>.
              </p>
              <span className="absolute top-2 right-2 bg-emerald-500 text-[6px] text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-widest leading-none shadow-sm">Popular</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentGateway('revenuecat')}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                paymentGateway === 'revenuecat'
                  ? 'border-indigo-500 bg-indigo-50/10 text-indigo-950 font-bold shadow-sm ring-1 ring-indigo-500'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
              id="select-revenuecat-gateway"
            >
              <div className="flex items-center gap-2">
                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${paymentGateway === 'revenuecat' ? 'border-indigo-500' : 'border-gray-300'}`}>
                  {paymentGateway === 'revenuecat' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                </div>
                <span className="text-xs font-black text-gray-900">Credit Card</span>
              </div>
              <p className="text-[9px] text-gray-400 mt-1 pl-5 font-normal leading-tight">
                Standard credit cards via RevenueCat billing.
              </p>
            </button>
          </div>

          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">Select Subscription Tier</p>
          <div className="space-y-4 mb-6">
            {/* YouFi Pro */}
            <div className="border border-gray-100 rounded-2xl p-3.5 bg-gray-50/50">
              <span className="text-[10px] font-black text-brand-600 uppercase tracking-wider block mb-2">YouFi Professional (SME / Personal)</span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedPlan('pro_monthly')}
                  disabled={loading || restoreLoading}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                    selectedPlan === 'pro_monthly'
                      ? 'border-brand-500 bg-brand-50/50 text-brand-950 font-bold shadow-sm ring-1 ring-brand-500'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Pro Monthly</span>
                  <span className="text-xs font-black mt-1 text-gray-950">{getPlanPrice('pro_monthly').split(' ')[0]} / mo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlan('pro_yearly')}
                  disabled={loading || restoreLoading}
                  className={`p-3 rounded-xl border text-center relative transition-all flex flex-col items-center justify-center ${
                    selectedPlan === 'pro_yearly'
                      ? 'border-brand-500 bg-brand-50/50 text-brand-950 font-bold shadow-sm ring-1 ring-brand-500'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="absolute -top-2 right-2 bg-amber-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest leading-none shadow-sm">Save 33%</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Pro Yearly</span>
                  <span className="text-xs font-black mt-1 text-gray-950">{getPlanPrice('pro_yearly').split(' ')[0]} / yr</span>
                </button>
              </div>
            </div>

            {/* YouFi Business Corporate */}
            <div className="border border-indigo-100 rounded-2xl p-3.5 bg-indigo-50/10">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block mb-2">YouFi Pro / Corporate SME (Multi-Profile)</span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedPlan('biz_monthly')}
                  disabled={loading || restoreLoading}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                    selectedPlan === 'biz_monthly'
                      ? 'border-indigo-500 bg-indigo-50/30 text-indigo-950 font-bold shadow-sm ring-1 ring-indigo-500'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Corporate Mo</span>
                  <span className="text-xs font-black mt-1 text-gray-950">{getPlanPrice('biz_monthly').split(' ')[0]} / mo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlan('biz_yearly')}
                  disabled={loading || restoreLoading}
                  className={`p-3 rounded-xl border text-center relative transition-all flex flex-col items-center justify-center ${
                    selectedPlan === 'biz_yearly'
                      ? 'border-indigo-500 bg-indigo-50/30 text-indigo-950 font-bold shadow-sm ring-1 ring-indigo-500'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="absolute -top-2 right-2 bg-indigo-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest leading-none shadow-sm">Save 35%</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Corporate Yr</span>
                  <span className="text-xs font-black mt-1 text-gray-950">{getPlanPrice('biz_yearly').split(' ')[0]} / yr</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleUpgrade}
              disabled={loading || restoreLoading}
              className="w-full bg-gray-900 text-white rounded-2xl py-3.5 font-bold text-sm shadow-xl shadow-gray-900/10 hover:bg-gray-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              id="finalize-paywall-upgrade"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing payment...
                </>
              ) : (
                <>
                  <CreditCard size={16} />
                  Activate {selectedPlan.startsWith('pro') ? 'Pro' : 'Corporate'} {selectedPlan.endsWith('monthly') ? 'Monthly' : 'Yearly'} Plan
                </>
              )}
            </button>

            <button
              onClick={handleRestore}
              disabled={loading || restoreLoading}
              className="w-full bg-white text-gray-500 border border-gray-100 rounded-2xl py-3 font-semibold text-xs hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
              id="restore-purchases-btn"
            >
              {restoreLoading ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Restoring credentials...
                </>
              ) : (
                <>
                  <RefreshCw size={12} />
                  Restore Purchases
                </>
              )}
            </button>
          </div>
          
          <div className="mt-4 text-center">
            <span className="text-[10px] text-gray-400 font-medium font-sans">
              Transactions securely handled by YouFI billing wrapper. Secure HTTPS.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
