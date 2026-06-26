import { useState, useEffect } from 'react';

export interface YouFINativeBridge {
  isNativeSupported: boolean;
  isPremium: boolean;
  
  schedulePaymentNotifications(
    instances: Array<{ id: string; dueDate: string; amount: number; status: string }>,
    title: string
  ): Promise<Array<{ instanceId: string; notificationId: string }>>;
  
  cancelNotification(instanceId: string): Promise<void>;
  cancelAllNotifications(): Promise<void>;
  
  getPushToken(): Promise<string>;
  
  getNotifications(): Promise<Array<{
    id: string;
    title: string;
    body: string;
    receivedAt: string;
    read: boolean;
    data?: any;
  }>>;
  
  getUnreadCount(): Promise<number>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  onNotificationReceived(callback: (notification: any) => void): void;
  
  // Calendar (Premium)
  syncToCalendar(
    instances: Array<{ id: string; dueDate: string; amount: number }>,
    title: string
  ): Promise<boolean>;
  
  removeFromCalendar(instanceIds: string[]): Promise<void>;
  
  // Receipt Scanning
  scanReceipt(): Promise<{ amount: number; merchant: string; date: string } | null>;
  scanProductImage(): Promise<{ name: string; price?: number; details?: string } | null>;
  
  // Premium
  getPremiumStatus(): Promise<boolean>;
  purchasePremium(planId: 'monthly' | 'yearly' | 'business'): Promise<boolean>;
  
  // Rewarded Ads (Free tier only)
  showRewardedAd(): Promise<{ reward: number }>;
  showInterstitialAd(): Promise<boolean>;
  
  // Utility
  defaultTransactionLimit: number;
  log(message: string): void;
}

// Check if running in a WebView on modern browsers/native
const isWebView = () => {
  if (typeof window === 'undefined') return false;
  const isRN = (window as any).ReactNativeWebView !== undefined;
  const isWV = typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent.includes('wv') : false;
  return isRN || isWV;
};

// Safe localStorage wrapper
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  }
};

// High-Fidelity React Native WebView Bridge
const createWebViewBridge = (): YouFINativeBridge => {
  return {
    isNativeSupported: true,
    get isPremium() {
      return safeStorage.getItem('youfi_premium') === 'true';
    },
    defaultTransactionLimit: 20,
    
    async schedulePaymentNotifications(instances, title) {
      console.log(`[WebViewBridge] Scheduling notifications for: ${title}`);
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'schedulePaymentNotifications',
          instances,
          title
        }));
      }
      return instances.map(inst => ({
        instanceId: inst.id,
        notificationId: 'native-' + inst.id
      }));
    },
    
    async cancelNotification(instanceId) {
      console.log(`[WebViewBridge] Cancelling notification: ${instanceId}`);
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'cancelNotification',
          instanceId
        }));
      }
    },
    
    async cancelAllNotifications() {
      console.log('[WebViewBridge] Cancelling all notifications');
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'cancelAllNotifications'
        }));
      }
    },
    
    async getPushToken() {
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'getPushToken'
        }));
      }
      return safeStorage.getItem('youfi_push_token') || 'fetching-native-token';
    },
    
    async getNotifications() {
      return [];
    },
    
    async getUnreadCount() {
      return 0;
    },
    
    async markNotificationAsRead(notificationId) {
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'markNotificationAsRead',
          notificationId
        }));
      }
    },
    
    async markAllAsRead() {
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'markAllAsRead'
        }));
      }
    },
    
    onNotificationReceived(callback) {
      // Setup listener if needed
    },
    
    async syncToCalendar(instances, title) {
      console.log(`[WebViewBridge] Syncing to Calendar: ${title}`);
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'syncToCalendar',
          instances,
          title
        }));
      }
      return true;
    },
    
    async removeFromCalendar(instanceIds) {
      console.log('[WebViewBridge] Removing from Calendar:', instanceIds);
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'removeFromCalendar',
          instanceIds
        }));
      }
    },
    
    async scanReceipt() {
      console.log('[WebViewBridge] Triggering native scanReceipt');
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'scanReceipt'
        }));
      }
      return null;
    },
    
    async scanProductImage() {
      console.log('[WebViewBridge] Triggering native scanProductImage');
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'scanProductImage'
        }));
      }
      return null;
    },
    
    async getPremiumStatus() {
      return safeStorage.getItem('youfi_premium') === 'true';
    },
    
    async purchasePremium(planId) {
      console.log(`[WebViewBridge] Requesting purchasePremium natively for: ${planId}`);
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'purchasePremium',
          planId
        }));
      }
      return true;
    },
    
    async showRewardedAd() {
      console.log('[WebViewBridge] Triggering native showRewardedAd');
      return new Promise<{ reward: number }>((resolve) => {
        (window as any)._pendingRewardResolve = resolve;
        if ((window as any).ReactNativeWebView) {
          (window as any).ReactNativeWebView.postMessage(JSON.stringify({
            type: 'showRewardedAd'
          }));
        } else {
          resolve({ reward: 0 });
        }
      });
    },
    
    async showInterstitialAd() {
      console.log('[WebViewBridge] Triggering native showInterstitialAd');
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'showInterstitialAd'
        }));
      }
      return true;
    },
    
    log(message) {
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'log',
          message
        }));
      }
    }
  };
};

// Web Mock Implementation for developers testing on the web version
const createWebFallbackBridge = (): YouFINativeBridge => {
  const getMockNotifications = (): any[] => {
    try {
      const stored = safeStorage.getItem('youfi_web_notifications');
      if (stored) {
        const list = JSON.parse(stored);
        return Array.isArray(list) ? list.filter((n: any) => n && n.id && !n.id.startsWith('mock-')) : [];
      }
    } catch (e) {}
    
    safeStorage.setItem('youfi_web_notifications', JSON.stringify([]));
    return [];
  };

  const saveMockNotifications = (notifications: any[]) => {
    safeStorage.setItem('youfi_web_notifications', JSON.stringify(notifications));
  };

  const listeners: Array<(notification: any) => void> = [];

  return {
    isNativeSupported: false,
    get isPremium() {
      return safeStorage.getItem('youfi_premium') === 'true';
    },
    defaultTransactionLimit: 20,
    
    async schedulePaymentNotifications(instances, title) {
      console.log(`[WebBridge] Scheduled payment notifications for: ${title}`, instances);
      const mappings = instances.map(inst => ({
        instanceId: inst.id,
        notificationId: 'notif-' + inst.id
      }));
      return mappings;
    },
    
    async cancelNotification(instanceId) {
      console.log(`[WebBridge] Cancelled notification for: ${instanceId}`);
    },
    
    async cancelAllNotifications() {
      console.log('[WebBridge] Cancelled all notifications');
    },
    
    async getPushToken() {
      return 'mock-web-push-token-1234567890';
    },
    
    async getNotifications() {
      return getMockNotifications();
    },
    
    async getUnreadCount() {
      const notifs = getMockNotifications();
      return notifs.filter(n => !n.read).length;
    },
    
    async markNotificationAsRead(notificationId) {
      const notifs = getMockNotifications();
      const updated = notifs.map(n => n.id === notificationId ? { ...n, read: true } : n);
      saveMockNotifications(updated);
    },
    
    async markAllAsRead() {
      const notifs = getMockNotifications();
      const updated = notifs.map(n => ({ ...n, read: true }));
      saveMockNotifications(updated);
    },
    
    onNotificationReceived(callback) {
      listeners.push(callback);
    },
    
    async syncToCalendar(instances, title) {
      console.log(`[WebBridge] Syncing ${instances.length} items for "${title}" to native Calendar`);
      return true;
    },
    
    async removeFromCalendar(instanceIds) {
      console.log('[WebBridge] Removed calendar instances:', instanceIds);
    },
    
    async scanReceipt() {
      console.log('[WebBridge] Simulating Receipt Scanning...');
      const simulateSuccess = window.confirm('Configure Web Sandbox: Simulate successful receipt scan?\n\nClick OK for high-fidelity scanning simulation ($45.99 at "Supermarket").\nClick Cancel to simulate empty result.');
      if (simulateSuccess) {
        return {
          amount: 45.99,
          merchant: 'Supermarket',
          date: new Date().toISOString().split('T')[0]
        };
      }
      return null;
    },

    async scanProductImage() {
      console.log('[WebBridge] Simulating Product Camera OCR...');
      const simulateSuccess = window.confirm('Configure Web Sandbox: Simulate successful optical character recognition of a product?\n\nClick OK to simulate identifying "Premium Steel Flask" with price $24.99.');
      if (simulateSuccess) {
        return {
          name: 'Premium Steel Flask',
          price: 24.99,
          details: '1L insulated flask'
        };
      }
      return null;
    },
    
    async getPremiumStatus() {
      return safeStorage.getItem('youfi_premium') === 'true';
    },
    
    async purchasePremium(planId) {
      console.log(`[WebBridge] Processing premium purchase: ${planId}`);
      safeStorage.setItem('youfi_premium', 'true');
      return true;
    },
    
    async showRewardedAd() {
      console.log(`[WebBridge] Showing rewarded ad...`);
      const watchSuccess = window.confirm('Configure Web Sandbox: Watch mock rewarded video ad to earn +20 transactions?');
      if (watchSuccess) {
        return { reward: 20 };
      }
      return { reward: 0 };
    },

    async showInterstitialAd() {
      console.log(`[WebBridge] Showing interstitial ad...`);
      if (window.confirm('Simulating Interstitial Ad. Did the user finish the ad?')) {
        return true;
      }
      return false;
    },
    
    log(message) {
      console.log(`[YouFI WebView Log]: ${message}`);
    }
  };
};

// Expose globally to guarantee window.YouFI is always accessible in code
if (typeof window !== 'undefined' && !(window as any).YouFI) {
  if (isWebView()) {
    (window as any).YouFI = createWebViewBridge();
  } else {
    (window as any).YouFI = createWebFallbackBridge();
  }
}

export function useNativeBridge() {
  const [isNative, setIsNative] = useState(isWebView());
  const [bridge, setBridge] = useState<YouFINativeBridge | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    // Default the app to free tier so token limits and paywalls apply
    if (safeStorage.getItem('youfi_premium') !== 'true') {
      safeStorage.setItem('youfi_premium', 'false');
    }

    // Expose dynamic updates so native can trigger reacts components instantly via injectJavaScript
    (window as any).updateYouFIPremiumStatus = (status: boolean) => {
      console.log('[NativeBridge] updateYouFIPremiumStatus called with:', status);
      safeStorage.setItem('youfi_premium', status ? 'true' : 'false');
      setIsPremium(status);
    };

    const handlePremiumEvent = (e: Event & { detail?: { isPremium: boolean } }) => {
      const status = e.detail?.isPremium;
      if (status !== undefined) {
        console.log('[NativeBridge] premiumStatusChanged event caught:', status);
        safeStorage.setItem('youfi_premium', status ? 'true' : 'false');
        setIsPremium(status);
      }
    };

    const handleMessageEvent = (event: MessageEvent) => {
      try {
        let parsed = event.data;
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }
        if (parsed) {
          if (parsed.type === 'premiumStatusChanged' || parsed.type === 'isPremium') {
            const status = parsed.isPremium !== undefined ? parsed.isPremium : parsed.value;
            console.log('[NativeBridge] Premium message event parsed:', status);
            safeStorage.setItem('youfi_premium', status ? 'true' : 'false');
            setIsPremium(status);
          }
          if (parsed.type === 'pushToken') {
            console.log('[NativeBridge] Received push token from native:', parsed.token);
            safeStorage.setItem('youfi_push_token', parsed.token);
          }
          if (parsed.type === 'rewardedAdCompleted') {
            console.log('[NativeBridge] Received rewarded ad completion from native:', parsed.reward);
            const reward = parsed.reward || 20;
            if ((window as any)._pendingRewardResolve) {
              (window as any)._pendingRewardResolve({ reward });
              (window as any)._pendingRewardResolve = null;
            }
          }
        }
      } catch (err) {
        // Safe fail
      }
    };

    window.addEventListener('premiumStatusChanged', handlePremiumEvent as any);
    window.addEventListener('message', handleMessageEvent);

    const handleDetection = () => {
      const nativeDetected = isWebView();
      setIsNative(nativeDetected);
      
      const activeBridge = (window as any).YouFI || (nativeDetected ? createWebViewBridge() : createWebFallbackBridge());
      setBridge(activeBridge);
      
      // Keep track of premium changes in local state for reactive views
      if (activeBridge.getPremiumStatus) {
        activeBridge.getPremiumStatus().then((status: boolean) => {
          setIsPremium(status);
        });
      } else {
        setIsPremium(activeBridge.isPremium);
      }
    };

    handleDetection();
    
    // Periodically re-check in case injection was slightly delayed
    const timer = setTimeout(handleDetection, 500);
    return () => {
      window.removeEventListener('premiumStatusChanged', handlePremiumEvent as any);
      window.removeEventListener('message', handleMessageEvent);
      clearTimeout(timer);
    };
  }, []);

  const refreshPremiumStatus = async () => {
    if (!bridge) return false;
    let status = false;
    if (bridge.getPremiumStatus) {
      status = await bridge.getPremiumStatus();
    } else {
      status = bridge.isPremium;
    }
    setIsPremium(status);
    return status;
  };

  return { isNative, bridge: bridge || ((window as any).YouFI) || createWebFallbackBridge(), isPremium, refreshPremiumStatus };
}
