import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import { 
  Home, Repeat, Target, MessageCircle, Plus, Menu, X, Sparkles, 
  ArrowDown, CreditCard, Settings, LogOut, Briefcase,
  Building2, ShoppingCart, Package, Wallet, TrendingUp, TrendingDown,
  BarChart3, Calendar, History, LineChart, WifiOff, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePrivacy } from '../contexts/PrivacyContext';
import { useUI } from '../contexts/UIContext';
import { usePremium } from '../contexts/PremiumContext';
import Paywall from './Paywall';
import { supabase } from '../services/supabase';
import { parseBusinessName } from '../lib/business';
import logo from '../assets/images/logo_icon.jpg';
import DuePaymentsBanner from './DuePaymentsBanner';
import { useAdManager } from './AdManager';

export default function Layout() {
  const { user, userProfile, logout } = useAuth();
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();
  const { isModalOpen, isAddIncomeOpen, setIsAddIncomeOpen } = useUI();
  const { handlePlusButtonClick } = useAdManager();
  const location = useLocation();
  const navigate = useNavigate();
  const { businessId: businessIdParam } = useParams();
  
  const { isPaywallOpen, paywallFeatureName, hidePaywall } = usePremium();

  // Custom hook-like behavior to extract businessId from pathname if not in params
  const businessIdMatch = location.pathname.match(/\/business\/([a-zA-Z0-9_-]+)/);
  const businessId = businessIdParam || (businessIdMatch ? businessIdMatch[1] : null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showBusinessAddMenu, setShowBusinessAddMenu] = useState(false);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also show standard support for TWAs and app state
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User installation choice outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadSidebarBusinesses();
      
      const bizChannel = supabase.channel('layout-businesses')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses', filter: `user_id=eq.${user.id}` }, () => {
          loadSidebarBusinesses();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(bizChannel);
      };
    }
  }, [user]);

  const loadSidebarBusinesses = async () => {
    try {
      const { data } = await supabase.from('businesses').select('*').eq('user_id', user.id);
      if (data) {
        setBusinesses(data.map((b: any) => {
          const meta = parseBusinessName(b.name);
          return {
            ...b,
            name: meta.name,
            category: meta.category,
            description: meta.description
          };
        }));
      }
    } catch (err) {
      console.error("Error loading sidebar businesses:", err);
    }
  };

  const isBusinessPage = location.pathname.startsWith('/business');
  const isCoachPage = location.pathname.includes('/coach');
  const activeBusiness = businesses.find(b => b.id === businessId);

  return (
    <div className="flex min-h-[100dvh] w-full bg-[#f8f9fc] flex-col relative">
      <DuePaymentsBanner />
      {isOffline && (
        <div className="w-full bg-orange-500 text-white text-xs font-bold py-1.5 flex justify-center items-center gap-2 z-50">
          <WifiOff size={14} />
          <span> Data is saved locally and will sync when you reconnect.</span>
        </div>
      )}
      <main className={`flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 ${isCoachPage ? 'pb-0' : isBusinessPage ? 'pb-8' : 'pb-32'} pt-4 relative z-0 hide-scrollbar`}>
        <Outlet />
      </main>
      
      {/* Minimal Top Header for Privacy eye toggle & PWA Install */}
      <div className="fixed top-4 left-4 flex items-center gap-2 z-[60]">
        <button 
          onClick={togglePrivacyMode}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 bg-white/90 backdrop-blur-md border border-gray-100 text-gray-500 shadow-md hover:bg-gray-50 hover:text-gray-700"
          title={isPrivacyMode ? "Disable Privacy Mode" : "Enable Privacy Mode"}
        >
          {isPrivacyMode ? <EyeOff size={18} className="text-indigo-600 animate-pulse" /> : <Eye size={18} />}
        </button>

        {showInstallBtn && (
          <button 
            onClick={handleInstallClick}
            className="h-10 px-4 rounded-full flex items-center gap-1.5 transition-all active:scale-95 bg-indigo-600 text-white shadow-md hover:bg-indigo-700 font-bold text-xs shrink-0 cursor-pointer"
            title="Install Expense Planner App"
          >
            <ArrowDown size={14} className="animate-bounce" />
            <span>Install App</span>
          </button>
        )}
      </div>

      {/* New Beautiful Bottom Navigation */}
      {!isModalOpen ? (
        <nav className="fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 pt-2 pb-4 sm:pb-3 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <div className="max-w-md mx-auto w-full flex justify-between items-center">
            {/* Home Tab */}
            <NavLink 
              to="/expenses-planner" 
              className={({ isActive }) => 
                `flex flex-col items-center justify-center flex-1 py-1 px-2 transition-all duration-200 rounded-xl ${
                  isActive || location.pathname === '/' 
                    ? 'text-indigo-600 font-bold' 
                    : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              <Home size={20} className="mb-0.5" />
              <span className="text-[10px] tracking-tight uppercase font-semibold">Home</span>
            </NavLink>

            {/* Add Income Center Button */}
            <button 
              type="button"
              onClick={() => {
                setIsAddIncomeOpen(true);
                if (location.pathname !== '/expenses-planner' && location.pathname !== '/') {
                  navigate('/expenses-planner');
                }
              }}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl px-4 py-2.5 font-bold shadow-md shadow-indigo-100 transition-all active:scale-95 mx-2 shrink-0 text-xs tracking-tight uppercase"
            >
              <Plus size={15} />
              <span>Add Income</span>
            </button>

            {/* Settings Tab */}
            <NavLink 
              to="/profile" 
              className={({ isActive }) => 
                `flex flex-col items-center justify-center flex-1 py-1 px-2 transition-all duration-200 rounded-xl ${
                  isActive 
                    ? 'text-indigo-600 font-bold' 
                    : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              <Settings size={20} className="mb-0.5" />
              <span className="text-[10px] tracking-tight uppercase font-semibold">Settings</span>
            </NavLink>
          </div>
        </nav>
      ) : null}
      
      {/* Central Global Paywall Component */}
      <Paywall 
        isOpen={isPaywallOpen} 
        onClose={hidePaywall} 
        featureName={paywallFeatureName} 
      />
    </div>
  );
}
