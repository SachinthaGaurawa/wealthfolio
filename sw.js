// ==================== WealthFlow Infinity Service Worker ====================
// Enhanced Push Notifications, Offline Caching, Background Sync & Auto-Notifications

const CACHE_NAME = 'wealthflow-v6.0';
const NOTIFICATION_DB_NAME = 'wealthflow-notifications';
const USER_PREFERENCES_KEY = 'userNotificationPrefs';

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing WealthFlow Service Worker...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activated');
  event.waitUntil(clients.claim());
  initializeNotificationPreferences();
});

function initializeNotificationPreferences() {
  // Default preferences for personalized notifications
  const defaultPrefs = {
    billReminders: true,
    paymentDue: true,
    savingsGoals: true,
    spendingAlerts: true,
    weeklySummary: true,
    monthlyReport: true,
    aiInsights: true,
    debtReminders: true,
    investmentUpdates: true,
    budgetWarnings: true,
    quietHoursStart: 22,
    quietHoursEnd: 8,
    notificationFrequency: 'smart', // smart, frequent, minimal
    lastNotificationTime: 0,
    notificationCooldown: 4 * 60 * 60 * 1000 // 4 hours
  };
  
  // Store in IndexedDB for persistence
  openNotificationDB().then(db => {
    const tx = db.transaction('preferences', 'readwrite');
    const store = tx.objectStore('preferences');
    store.put({ key: 'userPrefs', value: defaultPrefs };
  });
}

function openNotificationDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(NOTIFICATION_DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('preferences')) {
        db.createObjectStore('preferences', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('notificationLog')) {
        db.createObjectStore('notificationLog', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: 'WealthFlow Infinity',
    body: 'You have a new financial update.',
    icon: 'https://res.cloudinary.com/dzrfpc9be/image/upload/v1777660556/WealthFlow_Logo_tytp9p.png',
    badge: 'https://res.cloudinary.com/dzrfpc9be/image/upload/v1777660556/WealthFlow_Logo_tytp9p.png',
    tag: 'wealthflow-notification',
    data: { url: '/', type: 'general' }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    vibrate: [5, 40, 5, 40, 12, 60, 20],
    data: data.data || { url: '/', type: 'general' },
    actions: data.actions || [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    requireInteraction: false,
    renotify: true,
    silent: false
  };

  event.waitUntil(
    checkQuietHours().then(inQuietHours => {
      if (!inQuietHours) {
        return self.registration.showNotification(data.title, options);
      } else {
        console.log('[SW] Notification suppressed during quiet hours');
        return scheduleForLater(data);
      }
    })
  );
});

async function checkQuietHours() {
  try {
    const db = await openNotificationDB();
    const prefs = await getUserPreferences(db);
    
    if (!prefs) return false;
    
    const now = new Date();
    const currentHour = now.getHours();
    const { quietHoursStart, quietHoursEnd } = prefs;
    
    if (quietHoursStart > quietHoursEnd) {
      // Quiet hours span midnight
      return currentHour >= quietHoursStart || currentHour < quietHoursEnd;
    } else {
      return currentHour >= quietHoursStart && currentHour < quietHoursEnd;
    }
  } catch (e) {
    return false;
  }
}

function getUserPreferences(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('preferences', 'readonly');
    const store = tx.objectStore('preferences');
    const request = store.get('userPrefs');
    request.onsuccess = () => resolve(request.result?.value);
    request.onerror = () => reject(request.error);
  });
}

function scheduleForLater(notificationData) {
  // Store for later delivery after quiet hours
  return openNotificationDB().then(db => {
    const tx = db.transaction('notificationLog', 'readwrite');
    const store = tx.objectStore('notificationLog');
    store.add({
      ...notificationData,
      scheduledTime: Date.now() + 60 * 60 * 1000, // Schedule for 1 hour later
      status: 'pending'
    });
  });
}

// Check for pending notifications periodically
setInterval(checkPendingNotifications, 15 * 60 * 1000); // Every 15 minutes

async function checkPendingNotifications() {
  const db = await openNotificationDB();
  const tx = db.transaction('notificationLog', 'readwrite');
  const store = tx.objectStore('notificationLog');
  
  const request = store.getAll();
  request.onsuccess = async () => {
    const pending = request.result.filter(n => 
      n.status === 'pending' && n.scheduledTime <= Date.now()
    );
    
    for (const notification of pending) {
      await showNotification(notification);
      store.delete(notification.id);
    }
  };
}

async function showNotification(data) {
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    vibrate: [5, 40, 5, 40, 12, 60, 20],
    data: data.data,
    actions: data.actions || [],
    renotify: true
  };
  
  return self.registration.showNotification(data.title, options);
}

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  const action = event.action;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({ 
            type: 'NOTIFICATION_ACTION', 
            action: action,
            data: event.notification.data 
          });
          return;
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

// Background sync for notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'wealthflow-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(syncFinancialData());
  } else if (event.tag === 'wealthflow-notifications') {
    event.waitUntil(sendPersonalizedNotifications());
  }
});

async function sendPersonalizedNotifications() {
  // This would be called from the main app to trigger personalized notifications
  // The app sends a message to SW with notification data
}

async function syncFinancialData() {
  // Sync offline data when connection recovers
  const db = await openNotificationDB();
  // Implementation would sync any offline financial data
}

// Message handler for app-triggered notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options, scheduledTime } = event.data;
    
    if (scheduledTime) {
      // Schedule for later
      openNotificationDB().then(db => {
        const tx = db.transaction('notificationLog', 'readwrite');
        const store = tx.objectStore('notificationLog');
        store.add({
          title,
          ...options,
          scheduledTime,
          status: 'pending'
        });
      });
    } else {
      // Show immediately
      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    }
  } else if (event.data && event.data.type === 'UPDATE_PREFERENCES') {
    event.waitUntil(
      openNotificationDB().then(db => {
        const tx = db.transaction('preferences', 'readwrite');
        const store = tx.objectStore('preferences');
        store.put({ key: 'userPrefs', value: event.data.preferences };
      })
    );
  } else if (event.data && event.data.type === 'TRIGGER_PERSONALIZED') {
    event.waitUntil(generatePersonalizedNotification(event.data.context));
  }
});

async function generatePersonalizedNotification(context) {
  // Generate smart notifications based on user data
  const notifications = [];
  
  // Bill reminders
  if (context.upcomingBills?.length > 0) {
    const totalDue = context.upcomingBills.reduce((sum, b) => sum + b.amount, 0);
    notifications.push({
      title: '💰 Upcoming Bills',
      body: `You have ${context.upcomingBills.length} bills due soon. Total: LKR ${totalDue.toLocaleString()}`,
      tag: 'bills',
      data: { url: '/bills', type: 'billReminder' }
    });
  }
  
  // Savings progress
  if (context.savingsGoal) {
    const progress = (context.savingsGoal.current / context.savingsGoal.target) * 100;
    notifications.push({
      title: '🎯 Savings Progress',
      body: `You're ${progress.toFixed(1)}% towards your ${context.savingsGoal.name} goal!`,
      tag: 'savings',
      data: { url: '/savings', type: 'savingsProgress' }
    });
  }
  
  // Spending alert
  if (context.spendingAlert) {
    notifications.push({
      title: '⚠️ Spending Alert',
      body: context.spendingAlert.message,
      tag: 'spending',
      data: { url: '/spending', type: 'spendingAlert' }
    });
  }
  
  // Show one notification at a time with smart selection
  if (notifications.length > 0) {
    const selected = selectBestNotification(notifications);
    await showNotification(selected);
  }
}

function selectBestNotification(notifications) {
  // Priority-based selection
  const priority = ['spending', 'bills', 'savings'];
  for (const tag of priority) {
    const match = notifications.find(n => n.tag === tag);
    if (match) return match;
  }
  return notifications[0];
}

// Periodic check for auto-notifications (every 6 hours)
setInterval(() => {
  checkAndSendAutoNotifications();
}, 6 * 60 * 60 * 1000);

async function checkAndSendAutoNotifications() {
  // Request context from the app
  const clients = await self.clients.matchAll();
  if (clients.length > 0) {
    clients[0].postMessage({ type: 'REQUEST_NOTIFICATION_CONTEXT' });
  }
}
