import React from 'react';
import { motion } from 'motion/react';
import { Shield, Scale, Scroll, HelpCircle } from 'lucide-react';

export default function Terms() {
  const lastUpdated = "June 8, 2026";

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-300 max-w-4xl mx-auto px-2">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
            <Scroll size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Terms of Service</h1>
            <p className="text-xs text-gray-400 mt-1.5 font-medium">Last reviewed and updated on {lastUpdated}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5">
          <Scale size={14} className="text-brand-600 animate-pulse" />
          <span>Legally Binding Agreement</span>
        </div>
      </div>

      {/* Main Clause Content */}
      <div className="flex flex-col gap-5 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm" id="terms-sections">
        <div className="space-y-4">
          <h2 className="text-sm font-black text-brand-600 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-brand-600 rounded-full inline-block"></span>
            1. Agreement and Overview
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed font-normal">
            Welcome to YouFI. By registering an account, integrating third-party systems, establishing database profiles, or continuing to browse or use the YouFi web platform and native web apps, you agree to be bound by these Terms of Service. If you do not agree to all terms within this agreement, you are prohibited from utilizing our features or database APIs.
          </p>
        </div>

        <div className="h-px bg-gray-100/80 my-2" />

        <div className="space-y-4">
          <h2 className="text-sm font-black text-brand-600 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-brand-600 rounded-full inline-block"></span>
            2. Account Security & Verification
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed font-normal">
            To use key tools within YouFi, you must sign up using secure credentials or authorized external authentication (OAuth). You are entirely responsible for protecting your account keys and preventing unauthorized profile interaction. If any security loophole is compromised through direct negligence, YouFi shall not be held liable for resulting data loss.
          </p>
        </div>

        <div className="h-px bg-gray-100/80 my-2" />

        <div className="space-y-4">
          <h2 className="text-sm font-black text-brand-600 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-brand-600 rounded-full inline-block"></span>
            3. Scope of Services & AI Advisor Advice Disclaimer
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed font-normal">
            YouFi delivers digital ledger software for personal finance, bookkeeping, invoice tracking, inventory tracking, upcoming debt management, and structural financial analysis.
          </p>
          <div className="bg-amber-50 text-amber-900 border border-amber-200/60 p-4 rounded-2xl text-[11px] leading-relaxed flex gap-2.5 items-start">
            <Shield size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">CRITICAL DISCLAIMER:</span> The YouFi AI Coach/Advisor operates on public large language models for generalized context rendering. It does <span className="font-bold">NOT</span> represent certified legal, banking, or tax advising. Any financial action taken based on automated AI analysis is executed at the user’s sole professional risk. Always consult a certified CPA before making core fiscal shifts.
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100/80 my-2" />

        <div className="space-y-4">
          <h2 className="text-sm font-black text-brand-600 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-brand-600 rounded-full inline-block"></span>
            4. Premium Tiers, Billing cycles, & Payments
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed font-normal">
            Premium upgrades unlock unlimited entries, receipts scanning OCR, and calendar pushes. Standard billing cycles occur monthly or annually based on selection. YouFi reserves the right to adjust active prices or adjust feature limits with 30 days prior analytical notification.
          </p>
        </div>

        <div className="h-px bg-gray-100/80 my-2" />

        <div className="space-y-4">
          <h2 className="text-sm font-black text-brand-600 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-brand-600 rounded-full inline-block"></span>
            5. Termination Rights
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed font-normal">
            We reserve the right to suspend or terminate user profiles at any epoch if we witness attempts to decompile our codebases, inject malicious vectors, trigger DDoS payloads against our database wrappers, or spoof our payment processing.
          </p>
        </div>

        <div className="h-px bg-gray-100/80 my-2" />

        <div className="space-y-4">
          <h2 className="text-sm font-black text-brand-600 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-brand-600 rounded-full inline-block"></span>
            6. Inquiries and Contacts
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed font-normal">
            For operational legal inquiries, contact the compliance support desk directly at <span className="text-brand-600 font-bold">compliance@youfi.finance</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
