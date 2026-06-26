import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, Calendar, Sparkles, Receipt, BellRing, Info, ExternalLink } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationCenter({ businessId }: { businessId?: string }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Filter notifications based on businessId
  const filteredNotifications = notifications.filter(notif => {
    if (businessId) {
      return notif.businessId === businessId || notif.data?.businessId === businessId;
    } else {
      return !notif.businessId && !notif.data?.businessId;
    }
  });

  const filteredUnreadCount = filteredNotifications.filter(n => !n.read).length;

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: any) => {
    await markAsRead(notif.id);
    setIsOpen(false);
    
    // Perform navigation if deep link/data parameters exist
    if (notif.data?.route) {
      navigate(notif.data.route);
    } else if (notif.title.toLowerCase().includes('payment') || notif.body.toLowerCase().includes('payment')) {
      navigate('/upcoming-payments');
    } else if (notif.title.toLowerCase().includes('debt') || notif.body.toLowerCase().includes('debt')) {
      // If there's a business ID, navigate to its debts
      if (notif.data?.businessId) {
        navigate(`/business/${notif.data.businessId}/debts`);
      } else {
        navigate('/upcoming-payments'); // Fallback or personal debts
      }
    }
  };

  const getNotifIcon = (title: string, body: string) => {
    const text = (title + ' ' + body).toLowerCase();
    if (text.includes('premium') || text.includes('star') || text.includes('🌟')) {
      return <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center"><Sparkles size={16} /></div>;
    }
    if (text.includes('payment') || text.includes('bill') || text.includes('due')) {
      return <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center"><Calendar size={16} /></div>;
    }
    if (text.includes('receipt') || text.includes('scan')) {
      return <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center"><Receipt size={16} /></div>;
    }
    return <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center"><Info size={16} /></div>;
  };

  return (
    <div className="relative z-40" ref={containerRef} id="youfi-notification-center">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none"
        aria-label="Toggle notifications"
        id="notification-trigger-btn"
      >
        <Bell size={18} className={filteredUnreadCount > 0 ? 'animate-bounce' : ''} />
        {filteredUnreadCount > 0 && (
          <span 
            className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center px-1 animate-pulse"
            id="unread-badge-count"
          >
            {filteredUnreadCount > 9 ? '9+' : filteredUnreadCount}
          </span>
        )}
      </button>

      {/* Popover Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[80px] left-1/2 -translate-x-1/2 w-[calc(100vw-32px)] max-w-[400px] sm:absolute sm:left-auto sm:-translate-x-0 sm:top-full sm:right-0 sm:mt-3 sm:w-80 md:w-96 bg-white rounded-3xl border border-gray-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden"
            id="notifications-popover"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <BellRing size={16} className="text-gray-900" />
                <h3 className="font-bold text-sm text-gray-900">Notifications</h3>
              </div>
              {filteredUnreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
                  id="mark-all-read-btn"
                >
                  <CheckCheck size={14} />
                  Mark as read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50" id="notification-list-scrollable">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                    <Bell size={20} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-600">All caught up!</p>
                  <p className="text-xs mt-1 text-gray-400">No push or system alerts active.</p>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const relativeTime = (() => {
                    try {
                      return formatDistanceToNow(new Date(notif.receivedAt), { addSuffix: true });
                    } catch (e) {
                      return 'just now';
                    }
                  })();

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-4 flex gap-3 cursor-pointer hover:bg-gray-50 transition-all text-left ${
                        !notif.read ? 'bg-brand-50/10 border-l-2 border-brand-500' : ''
                      }`}
                      id={`notif-item-${notif.id}`}
                    >
                      {getNotifIcon(notif.title, notif.body)}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <p className={`text-xs font-semibold text-gray-900 truncate ${!notif.read ? 'font-bold' : ''}`}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                          {notif.body}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                          <span>{relativeTime}</span>
                          {notif.data?.route && (
                            <span className="text-brand-600 flex items-center gap-0.5">
                              View <ExternalLink size={8} />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 text-center border-t border-gray-50 bg-gray-50/20">
              <span className="text-[10px] font-medium text-gray-400 font-mono">
                YouFI Native Bridge Pipeline v1.0
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
