import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNativeBridge } from '../hooks/useNativeBridge';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  title: string;
  body: string;
  receivedAt: string;
  read: boolean;
  data?: any;
  businessId?: string;
}

interface NotificationContextProps {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { bridge } = useNativeBridge();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      let bridgeNotifs: Notification[] = [];
      if (bridge && bridge.getNotifications) {
        bridgeNotifs = await bridge.getNotifications();
      }

      // Generate dynamic notifications from real database records (Upcoming payments and Debts)
      const dynamicNotifs: Notification[] = [];
      
      if (user) {
        const d = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const todayStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

        const getDaysDiff = (d1Str: string, d2Str: string): number => {
          try {
            const parts1 = d1Str.split('-');
            const parts2 = d2Str.split('-');
            if (parts1.length < 3 || parts2.length < 3) return 999;
            const uDate1 = Date.UTC(parseInt(parts1[0]), parseInt(parts1[1]) - 1, parseInt(parts1[2]));
            const uDate2 = Date.UTC(parseInt(parts2[0]), parseInt(parts2[1]) - 1, parseInt(parts2[2]));
            return Math.round((uDate2 - uDate1) / (1000 * 3600 * 24));
          } catch (err) {
            return 999;
          }
        };

        // Fetch upcoming payments
        const { data: upcoming } = await supabase
          .from('upcoming_payments')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'unpaid');
          
        if (upcoming) {
          for (const item of upcoming) {
            const dueDateStr = item.due_date;
            if (!dueDateStr) continue;
            
            // Calculate day difference ignoring time zones exactly
            const diffDays = getDaysDiff(todayStr, dueDateStr);

            if (diffDays === 7 || diffDays === 1 || diffDays === 0 || diffDays < 0) {
              const isOverdue = diffDays < 0;
              let titlePrefix = diffDays === 0 ? 'Payment Due Today ⏰' : diffDays === 1 ? 'Payment Due Tomorrow ⏰' : diffDays === 7 ? 'Payment Due in 7 Days ⏰' : 'Overdue Payment ⚠️';

              let displayTitle = item.title || '';
              let bId: string | undefined = item.business_id || undefined;
              
              if (displayTitle.startsWith('[Biz:')) {
                const match = displayTitle.match(/^\[Biz:([^\]]+)\]\s*(.*)$/);
                if (match) {
                  bId = match[1];
                  displayTitle = match[2];
                }
              }

              dynamicNotifs.push({
                id: `dynamic_payment_${item.id}`,
                title: bId ? `Biz Bill: ${titlePrefix}` : titlePrefix,
                body: bId 
                  ? `Your business payment of ${item.amount} for ${displayTitle} is ${isOverdue ? 'overdue' : 'due soon'}.`
                  : `Your payment of ${item.amount} for ${displayTitle} is ${isOverdue ? 'overdue' : 'due soon'}.`,
                receivedAt: new Date().toISOString(),
                read: false,
                businessId: bId,
              });
            }
          }
        }

        // Fetch business debts
        const { data: debts } = await supabase
          .from('business_debts')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'unpaid');
          
        if (debts) {
          for (const item of debts) {
            const dueDateStr = item.due_date;
            if (!dueDateStr) continue;
            
            const diffDays = getDaysDiff(todayStr, dueDateStr);

            if (diffDays === 7 || diffDays === 1 || diffDays === 0 || diffDays < 0) {
              const isOverdue = diffDays < 0;
              let titlePrefix = diffDays === 0 ? 'Business Debt Due Today ⏰' : diffDays === 1 ? 'Business Debt Due Tomorrow ⏰' : diffDays === 7 ? 'Business Debt Due in 7 Days ⏰' : 'Business Debt Overdue ⚠️';

              dynamicNotifs.push({
                id: `dynamic_debt_${item.id}`,
                title: titlePrefix,
                body: `Your debt of ${item.amount} to ${item.lender} is ${isOverdue ? 'overdue' : 'due soon'}.`,
                receivedAt: new Date().toISOString(),
                read: false,
                businessId: item.business_id,
              });
            }
          }
        }
      }

      // Merge avoiding duplicates (prefer bridge if same ID)
      const combinedMap = new Map();
      bridgeNotifs.forEach(n => combinedMap.set(n.id, n));
      
      // We read dynamic statuses from localStorage to keep track of 'read' state for dynamically generated ones
      let localReadState: Record<string, boolean> = {};
      try {
        const stored = localStorage.getItem('youfi_dynamic_read_state');
        if (stored) localReadState = JSON.parse(stored);
      } catch (e) {}
      
      dynamicNotifs.forEach(n => {
        if (localReadState[n.id]) n.read = true;
        if (!combinedMap.has(n.id)) combinedMap.set(n.id, n);
      });

      const finalNotifs = Array.from(combinedMap.values()).sort(
        (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
      );
      
      setNotifications(finalNotifs);
      setUnreadCount(finalNotifs.filter(n => !n.read).length);
    } catch (error) {
      console.error('[NotificationContext] Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [bridge, user]);

  const markAsRead = async (id: string) => {
    try {
      if (id.startsWith('dynamic_')) {
        let localReadState: Record<string, boolean> = {};
        try {
          const stored = localStorage.getItem('youfi_dynamic_read_state');
          if (stored) localReadState = JSON.parse(stored);
        } catch (e) {}
        localReadState[id] = true;
        localStorage.setItem('youfi_dynamic_read_state', JSON.stringify(localReadState));
      } else if (bridge) {
        await bridge.markNotificationAsRead(id);
      }
      
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('[NotificationContext] Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (bridge) {
        await bridge.markAllAsRead();
      }
      
      let localReadState: Record<string, boolean> = {};
      try {
        const stored = localStorage.getItem('youfi_dynamic_read_state');
        if (stored) localReadState = JSON.parse(stored);
      } catch (e) {}
      
      let updatedCount = 0;
      setNotifications(prev => prev.map(n => {
        if (n.id.startsWith('dynamic_')) {
          localReadState[n.id] = true;
        }
        if (!n.read) updatedCount++;
        return { ...n, read: true };
      }));
      
      localStorage.setItem('youfi_dynamic_read_state', JSON.stringify(localReadState));
      setUnreadCount(0);
    } catch (error) {
      console.error('[NotificationContext] Error marking all as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (bridge && bridge.onNotificationReceived) {
      bridge.onNotificationReceived((newNotif: any) => {
        if (!newNotif) return;
        console.log('[NotificationContext] Notification received via bridge:', newNotif);
        
        const formatted: Notification = {
          id: newNotif.id || 'notif-' + Date.now(),
          title: newNotif.title || 'New Notification',
          body: newNotif.body || '',
          receivedAt: newNotif.receivedAt || new Date().toISOString(),
          read: !!newNotif.read,
          data: newNotif.data
        };

        setNotifications(prev => {
          if (prev.some(n => n.id === formatted.id)) return prev;
          const updated = [formatted, ...prev];
          setUnreadCount(updated.filter(x => !x.read).length);
          return updated;
        });
      });
    }

    if (user) {
      const channel = supabase.channel('notification-context-listener')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'upcoming_payments', filter: `user_id=eq.${user.id}` }, () => {
          fetchNotifications();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'business_debts', filter: `user_id=eq.${user.id}` }, () => {
          fetchNotifications();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      }
    }
  }, [bridge, fetchNotifications, user]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
