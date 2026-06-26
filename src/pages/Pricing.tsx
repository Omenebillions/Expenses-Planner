import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, HelpCircle, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNativeBridge } from '../hooks/useNativeBridge';
import { formatCurrency } from '../lib/currency';
import Paywall from '../components/Paywall';

const faqs = [
  {
    q: "Is there a free trial for the Premium plans?",
    a: "Yes! Since we operate a 14-day money-back guarantee, you can subscribe to any premium tier risk-free. If you contact support or cancel within 14 days, you get a full refund."
  },
  {
    q: "How does the Native Push-to-Calendar synchronization work?",
    a: "Once you upgrade, YouFi hooks directly into your iOS Calendar or Google Calendar on modern devices. Any upcoming debt payments, subscriptions, or tax dates are automatically synced to your default planner."
  },
  {
    q: "Can I manage multiple different businesses under one profile?",
    a: "Absolutely. Personal accounts represent you, but on the Business SME track, you can register and isolate as many LLCs, sole proprietorships, or partnerships as you require."
  },
  {
    q: "Is my financial transaction data secure?",
    a: "Security is our absolute priority. We utilize industry-standard 256-bit AES encryption end-to-end. Your transactions are stored securely and never sold to third parties."
  }
];

export default function Pricing() {
  const { userProfile } = useAuth();
  const { isPremium, refreshPremiumStatus } = useNativeBridge();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(1);

  const currencyCode = userProfile?.currency || 'USD';

  React.useEffect(() => {
    if (currencyCode !== 'USD') {
      fetch('https://open.er-api.com/v6/latest/USD')
        .then(res => res.json())
        .then(data => {
          if (data && data.rates && data.rates[currencyCode]) {
            setExchangeRate(data.rates[currencyCode]);
          }
        })
        .catch(err => console.error("Error fetching exchange rate:", err));
    }
  }, [currencyCode]);

  const getLocalizedPrice = (usdPrice: number) => {
    return formatCurrency(usdPrice * exchangeRate, currencyCode);
  };

  const getProPrice = () => {
    if (currencyCode === 'NGN') {
      return billingPeriod === 'yearly' ? '₦1,666' : '₦2,500';
    }
    return billingPeriod === 'yearly' ? getLocalizedPrice(3.33) : getLocalizedPrice(4.99);
  };

  const getProBilledText = () => {
    if (currencyCode === 'NGN') {
      return billingPeriod === 'yearly' ? 'Billed yearly: ₦20,000' : 'Billed monthly: ₦2,500';
    }
    return billingPeriod === 'yearly' ? `Billed yearly: ${getLocalizedPrice(39.99)}` : `Billed monthly: ${getLocalizedPrice(4.99)}`;
  };

  const getBizPrice = () => {
    if (currencyCode === 'NGN') {
      return billingPeriod === 'yearly' ? '₦5,000' : '₦7,000';
    }
    return billingPeriod === 'yearly' ? getLocalizedPrice(8.33) : getLocalizedPrice(12.99);
  };

  const getBizBilledText = () => {
    if (currencyCode === 'NGN') {
      return billingPeriod === 'yearly' ? 'Billed yearly: ₦60,000' : 'Billed monthly: ₦7,000';
    }
    return billingPeriod === 'yearly' ? `Billed yearly: ${getLocalizedPrice(99.99)}` : `Billed monthly: ${getLocalizedPrice(12.99)}`;
  };

  const freeFeatures = [
    "Manage up to 20 monthly transactions",
    "Primary Personal Finance ledger",
    "Basic category analysis & insights",
    "Add 1 business (SME limit)",
    "Clean, offline-capable local storage"
  ];

  const proFeatures = [
    "Unlimited personal & business transactions",
    "Smart Camera OCR receipt reader",
    "Native Google & iOS Calendar event synchronization",
    "Dynamic future projections & AI SME Coach advice",
    "Add up to 5 individual companies / SMEs",
    "Priority support channel & custom PDF exports",
    "No ads or subscription limit banners"
  ];

  const bizFeatures = [
    "Everything in Professional / Premium Plan",
    "Multi-user cooperation logins & credentials",
    "Register unlimited separate businesses",
    "Custom invoices and packing list generators",
    "Comprehensive API integration support",
    "Dedicated premium bookkeeping consultant"
  ];

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="relative text-center max-w-2xl mx-auto px-4 mt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 border border-brand-100 rounded-full text-brand-600 text-xs font-bold mb-3 md:mb-4">
          <Sparkles size={14} className="fill-brand-600" />
          <span>Flexible SME & Personal Planning Plans</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
          Simple, Transparent Pricing
        </h1>
        <p className="text-gray-500 text-sm mt-3 leading-relaxed">
          Unlock state-of-the-art receipt scanning, calendar task sync, and multiple business books. Choose the plan right for your growing vision.
        </p>

        {/* Monthly / Yearly Toggle */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <span className={`text-xs font-bold transition-colors ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
            className="w-12 h-6 bg-gray-200 rounded-full p-0.5 transition-colors relative flex items-center"
            aria-label="Toggle billing frequency"
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                billingPeriod === 'yearly' ? 'translate-x-6 bg-brand-600' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-xs font-bold transition-colors ${billingPeriod === 'yearly' ? 'text-gray-900' : 'text-gray-400'} flex items-center gap-1`}>
            Yearly
            <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest">
              Save 30%
            </span>
          </span>
        </div>
      </div>

      {/* Premium Notification Banner if active */}
      {isPremium && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-3xl max-w-xl mx-auto flex gap-3 items-center text-xs justify-center shadow-sm w-full">
          <ShieldCheck className="text-emerald-500 shrink-0" size={18} />
          <span className="font-semibold">Your account currently has YouFi Premium Tier status. Feel free to manage your tier details below.</span>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full px-2" id="pricing-plans-grid">
        {/* Core Free Plan */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 flex flex-col justify-between shadow-sm relative hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-lg font-black text-gray-900">Standard</h3>
            <p className="text-xs text-gray-400 mt-1">Perfect for simple personal ledger logs.</p>
            
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-black text-gray-950">{getLocalizedPrice(0)}</span>
              <span className="text-xs text-gray-400 font-bold">/ forever</span>
            </div>

            <div className="h-px bg-gray-100 mx-1 my-5" />

            <ul className="space-y-3.5">
              {freeFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-gray-600" id={`feature-free-${i}`}>
                  <Check className="text-brand-600 shrink-0 mt-0.5" size={14} strokeWidth={3} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <button
              disabled
              className="w-full bg-gray-100 text-gray-400 py-3 rounded-2xl font-bold text-xs text-center cursor-not-allowed hover:bg-gray-100 transition-colors"
            >
              Current Active Plan
            </button>
          </div>
        </div>

        {/* Pro Plan (Best Value) */}
        <div className="bg-gradient-to-b from-white to-brand-50/10 rounded-3xl border-2 border-brand-500 p-6 flex flex-col justify-between shadow-xl relative hover:shadow-2xl transition-all scale-100 md:scale-105">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-widest leading-none shadow-md">
            Most Popular
          </div>

          <div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-1.5">
                  Professional
                  <Sparkles size={16} className="text-amber-500 fill-amber-500" />
                </h3>
                <p className="text-xs text-gray-500 mt-1">Essential tools for ambitious managers.</p>
              </div>
            </div>
            
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3.5xl font-black text-gray-950">
                {getProPrice()}
              </span>
              <span className="text-xs text-gray-400 font-bold">/ month</span>
            </div>
            <p className="text-[10px] text-brand-600 font-extrabold mt-0.5">
              {getProBilledText()}
            </p>

            <div className="h-px bg-gray-200/60 mx-1 my-5" />

            <ul className="space-y-3.5">
              {proFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-gray-700" id={`feature-pro-${i}`}>
                  <Check className="text-emerald-500 shrink-0 mt-0.5" size={14} strokeWidth={3} />
                  <span className="font-semibold">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <button
              onClick={() => setPaywallOpen(true)}
              className="w-full bg-brand-600 text-white py-3.5 rounded-2xl font-black text-xs text-center shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all active:scale-95 duration-100 hover:shadow-xl"
              id="subscribe-pro-pricing"
            >
              {isPremium ? "Manage Subscription" : "Upgrade to Pro System"}
            </button>
          </div>
        </div>

        {/* Business Premium Corporate Plan */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 flex flex-col justify-between shadow-sm relative hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-lg font-black text-gray-900">Corporate SME</h3>
            <p className="text-xs text-gray-400 mt-1">For growing institutions with multiple teams.</p>
            
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-black text-gray-950">{getBizPrice()}</span>
              <span className="text-xs text-gray-400 font-bold">/ month</span>
            </div>
            <p className="text-[10px] text-indigo-600 font-extrabold mt-0.5">
              {getBizBilledText()}
            </p>

            <div className="h-px bg-gray-100 mx-1 my-5" />

            <ul className="space-y-3.5">
              {bizFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-gray-600" id={`feature-biz-${i}`}>
                  <Check className="text-brand-600 shrink-0 mt-0.5" size={14} strokeWidth={3} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <button
              onClick={() => setPaywallOpen(true)}
              className="w-full bg-gray-950 text-white py-3.5 rounded-2xl font-black text-xs text-center hover:bg-gray-800 transition-all active:scale-95 duration-100"
              id="subscribe-corp-pricing"
            >
              {isPremium ? "Manage Subscription" : "Upgrade to Corporate SME"}
            </button>
          </div>
        </div>
      </div>

      {/* Satisfaction Guarantee Badge */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 max-w-2xl mx-auto flex gap-3.5 items-center justify-center text-xs text-gray-500 w-full">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0 font-extrabold text-sm">
          14d
        </div>
        <div>
          <span className="font-bold text-gray-800">14-Day Ironclad Guarantee</span>
          <p className="text-[10px] text-gray-400">If you are unsatisfied with professional features, cancel under 14 days for a full refund back.</p>
        </div>
      </div>

      {/* FAQs Section */}
      <div className="max-w-2xl mx-auto w-full px-4 mt-4">
        <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2 mb-6 justify-center">
          <HelpCircle size={18} className="text-brand-600" />
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-4" id="pricing-faqs-list">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm" id={`faq-${index}`}>
              <h3 className="text-sm font-bold text-gray-900">{faq.q}</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Paywall Component logic mapping */}
      <Paywall
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        featureName="Direct Dashboard Pro Tier"
        onSuccess={() => {
          refreshPremiumStatus();
          setPaywallOpen(false);
        }}
      />
    </div>
  );
}
