'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Bell, 
  Check, 
  Clock, 
  QrCode, 
  Award, 
  BookOpen, 
  Megaphone,
  CheckCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function NotificationBell() {
  const { notifications, markNotificationRead, currentUser } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Filter notifications for current user or general announcements
  const userNotifications = notifications.filter(
    (n) => n.user_id === currentUser.id || !n.user_id || n.user_id === 'all'
  );

  const unreadNotifications = userNotifications.filter((n) => !n.leido);
  const unreadCount = unreadNotifications.length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    unreadNotifications.forEach((n) => markNotificationRead(n.id));
  };

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    markNotificationRead(notif.id);
    if (notif.url_redireccion) {
      setIsOpen(false);
      router.push(notif.url_redireccion);
    }
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'asistencia':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
            <QrCode className="w-4 h-4" />
          </div>
        );
      case 'nota':
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm">
            <Award className="w-4 h-4" />
          </div>
        );
      case 'tarea':
        return (
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-sm">
            <BookOpen className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
            <Megaphone className="w-4 h-4" />
          </div>
        );
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 60) {
        return diffMins <= 1 ? 'Hace un momento' : `Hace ${diffMins} min`;
      }
      if (diffHours < 24) {
        return `Hace ${diffHours} h`;
      }
      return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl transition-all duration-200 ${
          isOpen
            ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
        }`}
        title="Centro de Notificaciones"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5 transition-transform active:scale-95" />
        
        {/* Unread Counter Badge (Positioned cleanly on top-right edge) */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[10px] font-black text-white bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-950 shadow-md shadow-rose-500/30">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <h4 className="font-black text-sm text-slate-900 dark:text-white">
                Notificaciones
              </h4>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                  {unreadCount} nuevas
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar leídas
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {userNotifications.length > 0 ? (
              userNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer flex items-start gap-3 relative group ${
                    !notif.leido 
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20' 
                      : 'opacity-85 hover:opacity-100'
                  }`}
                >
                  {/* Icon */}
                  {getIcon(notif.tipo)}

                  {/* Body */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={`text-xs truncate ${!notif.leido ? 'font-black text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                        {notif.titulo}
                      </p>
                      {!notif.leido && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 ring-2 ring-rose-300 dark:ring-rose-900" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {notif.mensaje}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTime(notif.created_at)}
                      </span>
                      {notif.url_redireccion && (
                        <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center gap-0.5 ml-auto">
                          Ver detalles <ChevronRight className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Bell className="w-5 h-5 opacity-40" />
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  No tienes notificaciones pendientes
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
