import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNativeBridge } from '../hooks/useNativeBridge';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

interface PremiumContextType {
  isPremium: boolean;
  loading: boolean;
  aiTokens: number;
  refreshPremiumStatus: () => Promise<boolean>;
  refreshAITokens: () => Promise<number>;
  isPaywallOpen: boolean;
  paywallFeatureName: string;
  showPaywall: (featureName: string) => void;
  hidePaywall: () => void;
  consumeToken: () => Promise<boolean>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isPremium: bridgeIsPremium, refreshPremiumStatus: bridgeRefresh } = useNativeBridge();
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiTokens, setAITokens] = useState<number>(5);
  
  // Design Global Paywall Modal Triggers
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallFeatureName, setPaywallFeatureName] = useState('Premium Services');

  const showPaywall = (featureName: string) => {
    setPaywallFeatureName(featureName);
    setIsPaywallOpen(true);
  };

  const hidePaywall = () => {
    setIsPaywallOpen(false);
  };

  const refreshPremiumStatus = async () => {
    try {
      const status = await bridgeRefresh();
      setIsPremium(status);
      return status;
    } catch {
      return isPremium;
    }
  };

  const refreshAITokens = async () => {
    if (!user) return 5;
    try {
      // Find the row representing the AI Token count safely
      let { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', '__AI_TOKENS__')
        .maybeSingle();

      if (error) {
         console.warn("Could not load AI tokens from db. Checking local state.", error);
      }

      if (!data) {
        // First-time load: Initialize Welcome Pack of 5 tokens
        const { data: newRecord, error: insertError } = await supabase
          .from('budgets')
          .insert({
            user_id: user.id,
            category: '__AI_TOKENS__',
            amount: 5,
            period: 'all-time'
          })
          .select()
          .maybeSingle();
        
        if (!insertError && newRecord) {
          setAITokens(Number(newRecord.amount));
          return Number(newRecord.amount);
         }
      } else {
        const val = Math.max(0, Number(data.amount));
        setAITokens(val);
        return val;
      }
    } catch (err) {
      console.error("AI token lookup failure: ", err);
    }
    return 5;
  };

  const consumeToken = async () => {
    if (isPremium) return true;
    if (!user) return false;
    try {
      const current = await refreshAITokens();
      if (current <= 0) {
        showPaywall('Continuous AI Services');
        return false;
      }

      // Secure client-side update (backend also secure decrements on request)
      const nextCount = current - 1;
      const { error } = await supabase
        .from('budgets')
        .update({ amount: nextCount })
        .eq('user_id', user.id)
        .eq('category', '__AI_TOKENS__');

      if (!error) {
        setAITokens(nextCount);
        return true;
      }
    } catch (err) {
      console.error("Failed to consume token", err);
    }
    return false;
  };

  useEffect(() => {
    setIsPremium(bridgeIsPremium);
    setLoading(false);
  }, [bridgeIsPremium]);

  useEffect(() => {
    if (user) {
      refreshAITokens();
    }
  }, [user]);

  return (
    <PremiumContext.Provider value={{ 
      isPremium, 
      loading, 
      aiTokens, 
      refreshPremiumStatus, 
      refreshAITokens,
      isPaywallOpen,
      paywallFeatureName,
      showPaywall,
      hidePaywall,
      consumeToken
    }}>
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};

