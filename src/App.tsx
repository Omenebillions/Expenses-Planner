/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PremiumProvider } from './contexts/PremiumContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { useNativeBridge } from './hooks/useNativeBridge';
import { db } from './services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Profile from './pages/Profile';
import ExpensesPlanner from './pages/ExpensesPlanner';
import AuthCallback from './pages/AuthCallback';
import Pricing from './pages/Pricing';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import RefundPolicy from './pages/RefundPolicy';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function AppInitializer() {
  const { user } = useAuth();
  const { bridge } = useNativeBridge();
  const { fetchNotifications } = useNotifications();

  useEffect(() => {
    if (bridge?.onNotificationReceived) {
      bridge.onNotificationReceived((notification: any) => {
        if (notification) {
          console.log('[Native App Notification]: Received in foreground', notification);
          // Auto refresh values
          fetchNotifications();
        }
      });
    }
  }, [bridge, fetchNotifications]);

  useEffect(() => {
    const registerToken = async () => {
      if (bridge?.getPushToken && user) {
        try {
          const token = await bridge.getPushToken();
          if (token) {
            await setDoc(doc(db, 'push_tokens', user.uid), {
              user_id: user.uid,
              token,
              updated_at: new Date().toISOString(),
            }, { merge: true });
            console.log('[Native App Push Token]: Registered', token);
          }
        } catch (error) {
          console.error('[Native App Push Token]: Error during registration (safe backup):', error);
        }
      }
    };
    registerToken();
  }, [user, bridge]);

  return null;
}

import { AdManagerProvider } from './components/AdManager';

import { PrivacyProvider } from './contexts/PrivacyContext';

import { UIProvider } from './contexts/UIContext';

export default function App() {
  return (
    <AuthProvider>
      <PremiumProvider>
        <PrivacyProvider>
          <NotificationProvider>
            <UIProvider>
            <BrowserRouter>
              <AdManagerProvider>
                <AppInitializer />
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  
                  <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
                    <Route index element={<Navigate to="/expenses-planner" replace />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="expenses-planner" element={<ExpensesPlanner />} />
                    <Route path="pricing" element={<Pricing />} />
                    <Route path="terms" element={<Terms />} />
                    <Route path="privacy" element={<Privacy />} />
                    <Route path="refundpolicy" element={<RefundPolicy />} />
                  </Route>
                </Routes>
              </AdManagerProvider>
            </BrowserRouter>
            </UIProvider>
          </NotificationProvider>
        </PrivacyProvider>
      </PremiumProvider>
    </AuthProvider>
  );
}
