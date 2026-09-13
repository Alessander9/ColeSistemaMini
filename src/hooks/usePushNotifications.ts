'use client';

import { useEffect, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// usePushNotifications
// Handles:
//  1. Service Worker registration
//  2. Native Notification permission request
//  3. Sending OS-level notifications via SW postMessage or Notification API
// ─────────────────────────────────────────────────────────────────────────────

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  url?: string;
}

export function usePushNotifications() {
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const permissionRef = useRef<NotificationPermission>('default');

  // Register service worker once on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        swRegistrationRef.current = reg;
        console.log('[SW] Registered', reg.scope);
      })
      .catch((err) => {
        console.warn('[SW] Registration failed:', err);
      });

    // Track current permission
    if ('Notification' in window) {
      permissionRef.current = Notification.permission;
    }
  }, []);

  // Request notification permission (call this on a user gesture)
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    const perm = await Notification.requestPermission();
    permissionRef.current = perm;
    return perm;
  }, []);

  // Send a push notification (works even when tab is backgrounded if SW is active)
  const sendNotification = useCallback(async (payload: PushPayload) => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    // Auto-request permission if still 'default'
    let perm = permissionRef.current;
    if (perm === 'default') {
      perm = await Notification.requestPermission();
      permissionRef.current = perm;
    }

    if (perm !== 'granted') return;

    const sw = swRegistrationRef.current;
    if (sw && navigator.serviceWorker.controller) {
      // Send through SW — works in background on Android Chrome
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icon-192.png',
        tag: payload.tag || 'colesistema',
        url: payload.url || '/',
      });
    } else if (sw) {
      // SW registered but no active controller yet — use SW registration directly
      try {
        await sw.showNotification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icon-192.png',
          badge: '/icon-192.png',
          tag: payload.tag || 'colesistema',
          renotify: true,
          vibrate: [100, 50, 100],
          data: { url: payload.url || '/' },
        } as NotificationOptions & { badge?: string; renotify?: boolean; vibrate?: number[]; data?: unknown });
      } catch {
        // Fallback to direct Notification API
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icon-192.png',
          tag: payload.tag || 'colesistema',
        });
      }
    } else {
      // No SW — direct Notification API (foreground only)
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192.png',
        tag: payload.tag || 'colesistema',
      });
    }
  }, []);

  return { requestPermission, sendNotification, swRegistrationRef };
}
