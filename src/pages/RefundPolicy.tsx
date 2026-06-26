import React from 'react';
import { RefreshCw, Coins, Ban, Mail, CheckCircle2 } from 'lucide-react';

export default function RefundPolicy() {
  const lastUpdated = "June 8, 2026";

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-300 max-w-4xl mx-auto px-2">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
            <Coins size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Refund Policy</h1>
            <p className="text-xs text-gray-400 mt-1.5 font-medium">Last reviewed and updated on {lastUpdated}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 font-mono">
          <RefreshCw size={14} className="text-brand-600 animate-spin-slow" />
          <span>Transparent Returns</span>
        </div>
      </div>

      {/* Main content guidelines */}
      <div className="flex flex-col gap-5 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm" id="refund-sections">
        <div className="space-y-4">
          <h2 className="text-sm font-black text-brand-600 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-brand-600 rounded-full inline-block"></span>
            1. 14-Day Ironclad Guarantee
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed font-normal">
            At YouFI, we stand behind the premium financial planning tools we build. If you upgrade your standard free profile to the Professional/Premium Tier and find that the receipt OCR scanner, push notifications, SME coach elements, or unlimited transaction limits do not suit your strategy, we offer a <span className="font-bold text-gray-900">14-day fully unconditional money-back guarantee</span>.
          </p>
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-2xl text-[11px] leading-relaxed flex gap-2.5 items-start mt-2">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">PROMPT PROCESSING:</span> Simply dispatch a cancellation request within 14 calendar days of your initial transaction, and your subscription will be reverted with the complete balance returned to your original card provider.
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100/80 my-2" />

        <div className="space-y-4">
          <h2 className="text-sm font-black text-brand-600 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-brand-600 rounded-full inline-block"></span>
            2. Refund Eligibility after 14 Days
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed font-normal">
            Once the initial 14-day epoch expires, subscription charges are generally non-refundable, as server resources, LLM tokens for the AI Advisor, and OCR integrations are instantly provisioned. However, exceptions are analyzed on a case-by-case basis under the following specialized conditions:
          </p>
          <ul className="space-y-2.5 bg-gray-50 p-4 rounded-2xl text-[11px] text-gray-500 list-disc list-inside">
            <li><span className="font-bold text-gray-700">Prolonged System Outage:</span> Verifiable inability to access account ledgers lasting over 72 consecutive hours due to core database failure.</li>
            <li><span className="font-bold text-gray-700">Accidental Double Charge:</span> Confirmed parallel multi-billing events for the same subscription profile within a single cycle.</li>
            <li><span className="font-bold text-gray-700">Unprocessed Downgrades:</span> Confirmed subscription billing following a properly registered and timely pre-billing cancellation.</li>
          </ul>
        </div>

        <div className="h-px bg-gray-100/80 my-2" />

        <div className="space-y-4">
          <h2 className="text-sm font-black text-brand-600 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-brand-600 rounded-full inline-block"></span>
            3. Subscription Cancellations
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed font-normal">
            You can cancel future automated subscription renewals at any time by visiting your profile settings, clicking the "Manage Subscription" button, or disconnecting billing access. If you cancel mid-period, you will retain full Professional features until the end of that current billing cycle.
          </p>
        </div>

        <div className="h-px bg-gray-100/80 my-2" />

        <div className="space-y-4">
          <h2 className="text-sm font-black text-brand-600 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-brand-600 rounded-full inline-block"></span>
            4. Processing Milestones
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed font-normal">
            Approved refunds are instantly triggered in our transaction engine. Most banking institutions require around <span className="font-bold text-gray-900">5 to 10 business days</span> to post the corresponding statements back onto your credit card or bank history.
          </p>
        </div>

        <div className="h-px bg-gray-100/80 my-2" />

        <div className="space-y-4">
          <h2 className="text-sm font-black text-brand-600 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-brand-600 rounded-full inline-block"></span>
            5. Contact Billing Desk
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed font-normal flex flex-wrap items-center gap-1">
            <Mail size={14} className="text-brand-600 inline shrink-0" />
            <span>To file a return claim, contact our billing desk directly at</span>
            <span className="text-brand-600 font-bold hover:underline">billing@youfi.finance</span>
            <span>representing your transaction ID.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
