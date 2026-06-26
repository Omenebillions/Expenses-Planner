import React, { useEffect, createContext, useContext, useState, useRef } from 'react';
import { useNativeBridge } from '../hooks/useNativeBridge';
import { useLocation } from 'react-router-dom';

interface AdContextType {
  handlePlusButtonClick: () => void;
  isLoadingAd: boolean;
}

const AdContext = createContext<AdContextType>({
  handlePlusButtonClick: () => {},
  isLoadingAd: false,
});

export const useAdManager = () => useContext(AdContext);

export const AdManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isPremium, bridge } = useNativeBridge();
  const [plusClickCount, setPlusClickCount] = useState(0);
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  const location = useLocation();
  const hasCheckedAppOpen = useRef(false);

  // App open + daily interstitial logic (only for free users)
  useEffect(() => {
    if (isPremium || hasCheckedAppOpen.current) return;
    hasCheckedAppOpen.current = true;

    try {
      let openCount = parseInt(localStorage.getItem('youfi_app_opens') || '0', 10);
      openCount++;
      localStorage.setItem('youfi_app_opens', openCount.toString());

      const lastOpenDate = localStorage.getItem('youfi_last_open_date');
      const today = new Date().toDateString();

      const isFirstLoadOfDay = lastOpenDate !== today;
      const isFifthOpen = openCount % 5 === 0;

      if (isFirstLoadOfDay || isFifthOpen) {
        if (isFirstLoadOfDay) {
          localStorage.setItem('youfi_last_open_date', today);
        }
        
        // Wait a little bit for the app to settle before showing ad
        setTimeout(async () => {
          setIsLoadingAd(true);
          try {
            await bridge.showInterstitialAd();
          } catch (e) {
            console.error('Failed to show interstitial ad', e);
          } finally {
            setIsLoadingAd(false);
          }
        }, 1500);
      }
    } catch(err) {
      console.error('Error tracking app opens for ads', err);
    }
  }, [isPremium, bridge]);

  // Business Section interstitial
  useEffect(() => {
    if (isPremium) return;
    
    // Pattern: if the user clicks any route starting with /business
    if (location.pathname.startsWith('/business')) {
      const lastBizAdTime = parseInt(localStorage.getItem('youfi_last_biz_ad_time') || '0', 10);
      const now = Date.now();
      
      // Limit to showing once per session or every 10 minutes to avoid total spam
      if (now - lastBizAdTime > 10 * 60 * 1000) {
        localStorage.setItem('youfi_last_biz_ad_time', now.toString());
        setTimeout(async () => {
          setIsLoadingAd(true);
          try {
            await bridge.showInterstitialAd();
          } catch (e) {
            console.error('Failed to show business interstitial ad', e);
          } finally {
            setIsLoadingAd(false);
          }
        }, 500);
      }
    }
  }, [location.pathname, isPremium, bridge]);

  const handlePlusButtonClick = async () => {
    if (isPremium) return;

    const newCount = plusClickCount + 1;
    setPlusClickCount(newCount);

    if (newCount % 3 === 0) {
      setIsLoadingAd(true);
      try {
        await bridge.showInterstitialAd();
      } catch (e) {
        console.error('Failed to show plus button interstitial ad', e);
      } finally {
        setIsLoadingAd(false);
      }
    }
  };

  return (
    <AdContext.Provider value={{ handlePlusButtonClick, isLoadingAd }}>
      {children}
    </AdContext.Provider>
  );
};
