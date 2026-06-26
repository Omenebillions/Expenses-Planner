import React from 'react';
import { ShieldAlert, ShieldCheck, Eye, Lock } from 'lucide-react';

export default function Privacy() {
  const lastUpdated = "June 8, 2026";

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-300 max-w-4xl mx-auto px-2">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
            <Lock size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Privacy Policy</h1>
            <p className="text-xs text-gray-400 mt-1.5 font-medium">Last reviewed and updated on {lastUpdated}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5">
          <ShieldCheck size={14} className="text-emerald-500 animate-pulse" />
          <span>Active Data Shielding</span>
        </div>
      </div>

      {/* Main Content Blocks */}
      <div className="flex flex-col gap-5 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm" id="privacy-sections">
        <div className="space-y-4">
          <h2 className="text-sm font-black text-brand-600 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-brand-600 rounded-full inline-block"></span>
            1. Information We Collect
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed font-normal">
            YouFi values the privacy of your ledger entries. When you register layout structures, add companies, record incoming profits, post personal expenses, sync files, or manage inventory values, we parse and utilize the input data specifically to compile dashboards and deliver automated SME reports. No personal balance details are analyzed for third-party automated targeting or marketing profiling.
          </p>
          <ul className="space-y-2.5 bg-gray-50 p-4 rounded-2xl text-[11px] text-gray-500 list-disc list-inside">
            <li><span className="font-bold text-gray-700">Account Credentials:</span> Auth details managed securely through Supabase.</li>
            <li><span className="font-bold text-gray-700">Business Registry Data:</span> Financial figures, tax debt records, sales entries.</li>
            <li><span className="font-bold text-gray-700">System Permissions:</span> Push tokens registered for pending debt alerts.</li>
            <li><span className="font-bold text-gray-700">Camera OCR Data:</span> Live photos processed transiently during receipt parsing.</li>
          </ul>
        </div>

        <div className="h-px bg-gray-100/80 my-2" />

        <div className="space-y-4">
          <h2 className="text-sm font-black text-brand-600 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-brand-600 rounded-full inline-block"></span>
            2. How We Secure Your Data
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed font-normal">
            All tables are linked securely using Row-Level Security (RLS) rules in our backend databases. This guarantees that nobody but your validated user session has keys to fetch, read, or overwrite your ledger books. Furthermore, communications between web assets are strictly routed over verified SSL (TLS 1.3) protocols.
          </p>
        </div>

        <div className="h-px bg-gray-100/80 my-2" />

        <div className="space-y-4">
          <h2 className="text-sm font-black text-brand-600 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-brand-600 rounded-full inline-block"></span>
            3. Third-Party Integrations & Scope
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed font-normal">
            We interact with reliable third parties to support transaction tasks:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors">
              <span className="block text-xs font-bold text-gray-800">Supabase DB</span>
              <p className="text-[10px] text-gray-500 mt-1">Handles accounts storage, sessions, business ledger entities and metadata lists.</p>
            </div>
            <div className="p-3.5 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors">
              <span className="block text-xs font-bold text-gray-800">RevenueCat & Stripe</span>
              <p className="text-[10px] text-gray-500 mt-1">Safeguards premium licensing verification, invoice tokens, and monthly bills.</p>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100/80 my-2" />

        <div className="space-y-4">
          <h2 className="text-sm font-black text-brand-600 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-brand-600 rounded-full inline-block"></span>
            4. Your Consent & Rights (GDPR / CCPA)
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed font-normal">
            Depending on your physical province, you retain absolute rights to retrieve, edit, restrict, or wipe out your complete profile database entries. We provide a convenient Trash Bin and full security logs to let you keep strict eyes on your data footprints.
          </p>
        </div>

        <div className="h-px bg-gray-100/80 my-2" />

        <div className="space-y-4">
          <h2 className="text-sm font-black text-brand-600 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-brand-600 rounded-full inline-block"></span>
            5. Privacy Inquiries
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed font-normal">
            To invoke data extraction or profile erase guidelines, mail the security response office directly at <span className="text-brand-600 font-bold">privacy@youfi.finance</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
