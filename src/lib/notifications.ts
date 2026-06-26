export interface NotificationPayload {
  title: string;
  body: string;
  data?: any;
}

/**
 * Universal notification bridge.
 * If running in a standard web browser, it falls back to Web Notifications API.
 * If running inside an Expo WebView (e.g. wrapper), it sends a message to the native layer
 * to trigger local push notifications.
 */
export const triggerNotification = (payload: NotificationPayload) => {
  // 1. Check if we're wrapped in an Expo React Native WebView
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'SCHEDULE_NOTIFICATION',
      payload
    }));
    return;
  }

  // 2. Fallback to Web Browser Notification API
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notification');
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(payload.title, { body: payload.body });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(payload.title, { body: payload.body });
      }
    });
  }
};

/**
 * Helper to check upcoming payments and dispatch notifications 
 * if they are due today or exactly 1 day away.
 */
export const checkUpcomingPaymentNotifications = (payments: any[]) => {
  if (!payments || payments.length === 0) return;

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

  payments.forEach(payment => {
    if (!payment.due_date) return;
    const daysAway = getDaysDiff(todayStr, payment.due_date);

    // A simple guard to prevent spamming notifications (in a real app, track sent IDs in localStorage)
    const storageKey = `notified_${payment.id}_${daysAway}`;
    if (localStorage.getItem(storageKey)) return;

    if (daysAway === 1) {
      triggerNotification({
        title: 'Upcoming Payment Tomorrow! 📅',
        body: `Reminder: Your payment for ${payment.name || payment.title || 'a bill'} is due tomorrow.`,
        data: { paymentId: payment.id }
      });
      localStorage.setItem(storageKey, 'true');
    } else if (daysAway === 0) {
      triggerNotification({
        title: 'Payment Due Today! ⚠️',
        body: `Your payment for ${payment.name || payment.title || 'a bill'} is due today.`,
        data: { paymentId: payment.id }
      });
      localStorage.setItem(storageKey, 'true');
    }
  });
};
