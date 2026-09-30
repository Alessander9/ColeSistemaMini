'use client';

import { useSyncExternalStore } from 'react';
import { ToastMessage } from '@/types';

// Los avisos (toasts) viven fuera del AppContext: mostrar u ocultar uno solo vuelve a
// dibujar el contenedor de avisos, no toda la aplicación.
let toasts: ToastMessage[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

export function removeToast(id: string) {
  if (!toasts.some(t => t.id === id)) return;
  toasts = toasts.filter(t => t.id !== id);
  emit();
}

export function pushToast(toast: Omit<ToastMessage, 'id'>) {
  const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  toasts = [...toasts.slice(-4), { ...toast, id }];
  emit();
  setTimeout(() => removeToast(id), toast.duracionMs ?? 4000);
  return id;
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
const EMPTY: ToastMessage[] = [];

export function useToasts() {
  return useSyncExternalStore(subscribe, () => toasts, () => EMPTY);
}
