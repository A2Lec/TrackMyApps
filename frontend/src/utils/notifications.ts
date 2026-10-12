// Utility functions for browser notifications

export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported in this browser');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const showBrowserNotification = (
  title: string,
  options?: NotificationOptions
): Notification | null => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    return new Notification(title, {
      icon: '/icon-192.png',
      badge: '/badge-96.png', // monochrome: Android only keeps the alpha channel
      ...options,
    });
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
};

// Schedule notification for a reminder
export const scheduleReminderNotification = (
  title: string,
  dueDate: Date,
  description?: string
) => {
  const now = new Date();
  const timeUntilDue = dueDate.getTime() - now.getTime();

  if (timeUntilDue <= 0) {
    // Show immediately if due date is in the past or now
    showBrowserNotification(title, {
      body: description || 'Vous avez un rappel en attente',
      tag: `reminder-${Date.now()}`,
      requireInteraction: true,
    });
  } else if (timeUntilDue < 24 * 60 * 60 * 1000) {
    // Schedule within 24 hours (browser limitation)
    setTimeout(() => {
      showBrowserNotification(title, {
        body: description || 'Vous avez un rappel maintenant',
        tag: `reminder-${Date.now()}`,
        requireInteraction: true,
      });
    }, timeUntilDue);
  }
};

// Check notification at regular intervals
export const setupNotificationChecker = (
  checkCallback: () => Promise<void>,
  intervalMinutes: number = 1
) => {
  // Check immediately
  checkCallback();

  // Then check at intervals
  const intervalMs = intervalMinutes * 60 * 1000;
  const intervalId = setInterval(checkCallback, intervalMs);

  // Return cleanup function
  return () => clearInterval(intervalId);
};
