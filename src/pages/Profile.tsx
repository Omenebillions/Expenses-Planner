import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, DollarSign, Save, Trash2, MapPin, RefreshCw } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { CURRENCIES } from '../lib/currency';
import { detectLocationAndCurrency, ExtractedLocation } from '../lib/location';

export default function Profile() {
  const { userProfile, user, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [income, setIncome] = useState(userProfile?.income?.toString() || '0');
  const [currency, setCurrency] = useState(userProfile?.currency || 'USD');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [detectedInfo, setDetectedInfo] = useState<ExtractedLocation | null>(null);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    const fetchDetection = async () => {
      setDetecting(true);
      try {
        const info = await detectLocationAndCurrency();
        setDetectedInfo(info);
      } catch (e) {
        console.warn("Location detection error in profile:", e);
      } finally {
        setDetecting(false);
      }
    };
    fetchDetection();
  }, []);

  const handleUpdate = async () => {
    if (!user) return;
    setLoading(true);
    setSaved(false);
    
    try {
      const { error } = await supabase.from('users').update({
        income: parseFloat(income),
        currency: currency
      }).eq('id', user.id);
      
      if (error) throw error;
      
      await refreshProfile();
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error("Error updating profile:", e);
    } finally {
      setLoading(false);
    }
  };

  const currentSymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';

  return (
    <div className="flex flex-col tracking-tight pt-4 pb-32">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 px-1 pr-12">Settings</h1>
      
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 mb-6 relative overflow-hidden">
        <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-brand-400 to-brand-600 left-0"></div>
        <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User size={32} />
            )}
        </div>
        <div>
           <h2 className="text-xl font-bold text-gray-900">{userProfile?.name}</h2>
           <p className="text-sm text-gray-500">{userProfile?.email}</p>
        </div>
      </div>
      
      {/* Financial Setup */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign size={16} className="text-brand-500" />
            Financial Baseline
        </h3>
        
        <div className="space-y-4">
           <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Global Currency</label>
              <select 
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition-colors text-gray-900 font-semibold mb-3"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>

              {/* Auto-detected Location Info */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner my-2">
                <div className="flex items-start gap-2.5">
                  <MapPin className="text-zinc-600 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Detected Location & Currency</h4>
                    {detecting ? (
                      <div className="flex items-center gap-2 mt-0.5">
                        <RefreshCw size={12} className="animate-spin text-indigo-600" />
                        <span className="text-xs text-indigo-700 font-semibold">Detecting location...</span>
                      </div>
                    ) : detectedInfo ? (
                      <p className="text-sm font-bold text-gray-800">
                        {detectedInfo.city ? `${detectedInfo.city}, ` : ''}{detectedInfo.countryName} ({detectedInfo.currency})
                      </p>
                    ) : (
                      <span className="text-xs text-gray-400">Detection unavailable</span>
                    )}
                  </div>
                </div>

                {!detecting && detectedInfo && currency !== detectedInfo.currency && (
                  <button
                    type="button"
                    onClick={() => setCurrency(detectedInfo.currency)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1 shrink-0 self-start sm:self-center"
                  >
                    Apply {detectedInfo.currency}
                  </button>
                )}
              </div>
           </div>
           <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Monthly Income ({currentSymbol})</label>
              <input 
                type="number" 
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition-colors text-gray-900 font-semibold"
              />
           </div>
           
           <button 
             onClick={handleUpdate}
             disabled={loading}
             className="w-full bg-gray-900 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
           >
              {loading ? 'Saving...' : (
                <>
                  <Save size={16} /> Save Changes
                </>
              )}
           </button>
           {saved && <p className="text-xs text-center text-success-500 font-medium">Settings updated successfully! Changes may require a refresh.</p>}
        </div>
      </div>
      
      {/* System Settings */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            System
        </h3>
        
        <button 
          onClick={() => navigate('/trash')}
          className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-4 font-bold flex items-center justify-between px-4 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2 text-gray-700">
            <Trash2 size={20} />
            View Trash Bin
          </div>
        </button>
      </div>

      {/* Logout */}
      <button 
        onClick={logout}
        className="w-full mt-auto bg-white border border-danger-200 text-danger-500 rounded-2xl py-4 font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
      >
         <LogOut size={20} />
         Log Out
      </button>
    </div>
  );
}
