import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { Reminder } from '../types';

/**
 * Request notification permission — call this only when the user
 * creates a reminder, not on app startup.
 */
export async function requestNotificationPermission(): Promise<'granted' | 'denied'> {
  if (!Capacitor.isNativePlatform()) return 'granted';
  try {
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

/**
 * Schedule local notifications for pending reminders.
 * Does NOT request permission — call requestNotificationPermission() first
 * when the user creates a new reminder.
 */
export async function scheduleReminderNotifications(reminders: Reminder[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const pending = reminders.filter(r => !r.done);
  const upcoming = pending.filter(r => {
    const due = new Date(r.date);
    const now = new Date();
    return due > now;
  });

  if (upcoming.length === 0) {
    try { await LocalNotifications.cancel({ notifications: [] }); } catch { /* ignore */ }
    return;
  }

  try {
    const notifications = upcoming.map(r => {
      const due = new Date(r.date);
      due.setHours(9, 0, 0, 0);
      return {
        id: hashId(r.id),
        title: 'TerraCerta — Lembrete',
        body: r.title,
        schedule: { at: due },
        smallIcon: 'ic_stat_leaf',
        largeIcon: 'ic_launcher',
      };
    });

    await LocalNotifications.cancel({
      notifications: upcoming.map(r => ({ id: hashId(r.id) })),
    });
    await LocalNotifications.schedule({ notifications });
  } catch {
    // Notifications are a nice-to-have — fail silently
  }
}

function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export async function cancelReminderNotification(reminderId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: hashId(reminderId) }] });
  } catch { /* ignore */ }
}
