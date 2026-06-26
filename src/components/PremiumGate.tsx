import React, { useState } from 'react';
import { ShieldAlert, Sparkles, Lock } from 'lucide-react';
import { useNativeBridge } from '../hooks/useNativeBridge';
import UpgradePrompt from './UpgradePrompt';

interface PremiumGateProps {
  children: React.ReactNode;
  featureName?: string;
  fallbackType?: 'card' | 'inline' | 'silent';
  className?: string;
}

export default function PremiumGate({ 
  children, 
  featureName = "this premium feature", 
  fallbackType = 'card',
  className = "" 
}: PremiumGateProps) {
  const { isPremium, refreshPremiumStatus } = useNativeBridge();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Re-read status safely on mount to prevent layout flickers
  React.useEffect(() => {
    refreshPremiumStatus();
  }, []);

  if (isPremium) {
    return <>{children}</>;
  }

  const handleSuccess = () => {
    // Premium activated successfully
    refreshPremiumStatus();
  };

  if (fallbackType === 'silent') {
    return null;
  }

  if (fallbackType === 'inline') {
    return (
      <div className={`flex items-center gap-2 p-3 bg-amber-50/50 border border-amber-200/50 rounded-2xl text-amber-800 text-xs font-semibold ${className}`}>
        <Lock size={12} className="text-amber-600 flex-shrink-0" />
        <span>Upgrade required to use {featureName}.</span>
        <button 
          onClick={() => setShowUpgradeModal(true)}
          className="ml-auto text-brand-600 hover:underline font-bold"
        >
          Unlock
        </button>
        <UpgradePrompt 
          isOpen={showUpgradeModal} 
          onClose={() => setShowUpgradeModal(false)} 
          featureName={featureName}
          onSuccess={handleSuccess}
        />
      </div>
    );
  }

  return (
    <div className={`p-8 bg-gray-50 border border-gray-100 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden ${className}`}>
      {/* Decorative gradient flare */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-200/10 rounded-full blur-2xl" />

      <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4 relative z-10">
        <Lock size={20} className="stroke-[2.5]" />
      </div>

      <h3 className="text-sm font-bold text-gray-900 relative z-10 flex items-center gap-1.5 justify-center">
        <Sparkles size={14} className="text-amber-500 fill-amber-500" />
        Unlock {featureName}
      </h3>
      <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto relative z-10 leading-relaxed">
        This high-tier utility is linked to your native YouFI core account. Unlock instant sync and premium models now!
      </p>

      <button
        onClick={() => setShowUpgradeModal(true)}
        className="mt-5 bg-gradient-to-r from-amber-500 to-brand-600 hover:from-amber-600 hover:to-brand-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 relative z-10"
        id="gate-unlock-btn"
      >
        <Sparkles size={12} className="fill-current" />
        Upgrade Account
      </button>

      <UpgradePrompt 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        featureName={featureName}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
